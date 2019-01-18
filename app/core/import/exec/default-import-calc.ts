import {Document} from "idai-components-2/src/model/core/document";
import {ImportValidator} from "./import-validator";
import {duplicates, hasNot, isUndefinedOrEmpty, to, equal,
    isArray, includedIn, isNot, undefinedOrEmpty, asyncMap} from "tsfun";
import {ImportErrors as E} from "./import-errors";
import {Relations} from "idai-components-2/src/model/core/relations";
import {RelationsCompleter} from "./relations-completer";
import {NewDocument} from "idai-components-2/src/model/core/new-document";
import {DocumentMerge} from "./document-merge";
import {clone} from "../../util/object-util";


/**
 * @author Daniel de Oliveira
 * @author Thomas Kleinke
 */
export module DefaultImportCalc {

    const RECORDED_IN = 'isRecordedIn';
    const LIES_WITHIN = 'liesWithin';
    const INCLUDES = 'includes';
    const PARENT = 'parent';
    const forbiddenRelations = [LIES_WITHIN, INCLUDES, RECORDED_IN];


    export function build(validator: ImportValidator,
                          operationTypeNames: string[],
                          generateId: () => string,
                          find: (identifier: string) => Promise<Document|undefined>,
                          get: (resourceId: string) => Promise<Document>,
                          getInverseRelation: (propertyName: string) => string|undefined,
                          mergeMode: boolean,
                          allowOverwriteRelationsInMergeMode: boolean,
                          mainTypeDocumentId: string,
                          useIdentifiersInRelations: boolean) {

        if (mainTypeDocumentId && mergeMode) {
            throw 'FATAL ERROR - illegal argument combination - mainTypeDocumentId and mergeIfExists must not be both truthy';
        }
        // TODO set includes relations and adjust tests to check the results, or decide to not set includes at all

        return async function process(documents: Array<Document>) {

            try {
                const documentsForUpdate = await processDocuments(
                    documents,
                    validator,
                    mergeMode, allowOverwriteRelationsInMergeMode, useIdentifiersInRelations,
                    find, get, generateId);

                const relatedDocuments = await processRelations(
                    documentsForUpdate,
                    validator, operationTypeNames,
                    mergeMode, allowOverwriteRelationsInMergeMode,
                    getInverseRelation, get,
                    mainTypeDocumentId);

                return [documentsForUpdate, relatedDocuments, undefined];
            } catch (errWithParams) {
                return [[],[], errWithParams];
            }
        }
    }


    /**
     * @returns clones of the documents with their properties adjusted
     */
    async function processDocuments(documents: Array<Document>,
                                    validator: ImportValidator,
                                    mergeMode: boolean,
                                    allowOverwriteRelationsInMergeMode: boolean,
                                    useIdentifiersInRelations: boolean,
                                    find: (identifier: string) => Promise<Document|undefined>,
                                    get: (resourceId: string) => Promise<Document>,
                                    generateId: () => string): Promise<Array<Document>> {


        async function preprocessAndValidateRelations(document: Document): Promise<Document> {

            const relations = document.resource.relations;
            if (!relations) return document;
            
            const foundForbiddenRelations = Object.keys(document.resource.relations)
                .filter(includedIn(forbiddenRelations))
                .join(', ');
            if (foundForbiddenRelations) throw [E.INVALID_RELATIONS, document.resource.type, foundForbiddenRelations];

            if (isArray(relations[PARENT])) throw [E.PARENT_MUST_NOT_BE_ARRAY, document.resource.identifier];
            if (relations[PARENT]) (relations[LIES_WITHIN] = [relations[PARENT] as any]) && delete relations[PARENT];

            if ((!mergeMode || allowOverwriteRelationsInMergeMode)  && useIdentifiersInRelations) {
                removeSelfReferencingIdentifiers(relations, document.resource.identifier);
                await rewriteIdentifiersInRelations(relations, find, identifierMap);
            } else {
                await assertNoMissingRelationTargets(relations, get);
            }
            return document;
        }


        const dups = duplicates(documents.map(to('resource.identifier')));
        if (dups.length > 0) throw [E.DUPLICATE_IDENTIFIER, dups[0]];
        const identifierMap: { [identifier: string]: string } = mergeMode ? {} : assignIds(documents, generateId);

        return await asyncMap(async (document: Document) => {
            let _ = clone(document); 
            _ = await preprocessAndValidateRelations(_);
            _ = await mergeOrUseAsIs(_, find, mergeMode, allowOverwriteRelationsInMergeMode);
            return validate(_, validator, mergeMode);
        })(documents);
    }


    async function processRelations(documents: Array<Document>,
                                    validator: ImportValidator,
                                    operationTypeNames: string[],
                                    mergeMode: boolean,
                                    allowOverwriteRelationsInMergeMode: boolean,
                                    getInverseRelation: (_: string) => string|undefined,
                                    get: (_: string) => Promise<Document>,
                                    mainTypeDocumentId: string) {


        async function setRecordedIns() {

            // TODO replace traversal of documents with hash based access and also look for existing docs if not found in import
            async function setRecordedInsFor(document: Document): Promise<string|undefined> {

                const relations = document.resource.relations;
                if (!relations
                    || isUndefinedOrEmpty(relations[LIES_WITHIN])
                    || isNot(undefinedOrEmpty)(relations[RECORDED_IN])) return;

                const liesWithinTargetInImport = searchInImport(relations[LIES_WITHIN][0], documents, operationTypeNames);
                if (liesWithinTargetInImport) {
                    if (liesWithinTargetInImport[0]) return liesWithinTargetInImport[0] as any;
                    else if (isNot(undefinedOrEmpty)((liesWithinTargetInImport as any)[1].resource.relations[LIES_WITHIN])) {
                        return await setRecordedInsFor((liesWithinTargetInImport[1] as any));
                    }
                }
                try {
                    const got = await get(relations[LIES_WITHIN][0]);
                    return  operationTypeNames.includes(got.resource.type)
                        ? got.resource.id
                        : got.resource.relations[RECORDED_IN][0];
                } catch { console.log("FATAL - not found") } // should have been caught earlier, in processDocuments
            }

            for (let document of documents) {
                const relations = document.resource.relations;

                const _ = await setRecordedInsFor(document);
                if (_) relations[RECORDED_IN] = [_];
                if (relations && equal(relations[RECORDED_IN])(relations[LIES_WITHIN])) {
                    delete relations[LIES_WITHIN];
                }
            }
        }


        async function replaceTopLevelLiesWithins() {

            for (let document of documents) {
                const relations = document.resource.relations;
                if (!relations || !relations[LIES_WITHIN]) continue;

                let liesWithinTarget = undefined;
                try { liesWithinTarget = await get(relations[LIES_WITHIN][0]) } catch {}
                if (liesWithinTarget && operationTypeNames.includes(liesWithinTarget.resource.type)) {

                    if (mainTypeDocumentId) throw [E.PARENT_ASSIGNMENT_TO_OPERATIONS_NOT_ALLOWED];

                    relations[RECORDED_IN] = relations[LIES_WITHIN];
                    delete relations[LIES_WITHIN];
                }
            }
        }


        if (!mergeMode) await prepareIsRecordedInRelation(documents, validator, mainTypeDocumentId);
        await replaceTopLevelLiesWithins();
        if (!mainTypeDocumentId) await setRecordedIns();

        return !mergeMode || allowOverwriteRelationsInMergeMode
            ? await RelationsCompleter.completeInverseRelations(
                documents,
                get, getInverseRelation,
                mergeMode)
            : [];
    }
    // if (!arrayEqual(liesWithinTarget.resource.relations[RECORDED_IN])(document.resource.relations[RECORDED_IN])) {
    //     throw [ImportErrors.LIES_WITHIN_TARGET_NOT_MATCHES_ON_IS_RECORDED_IN, document.resource.identifier];
    // }
    // TODO every resource has to have a lies within relation
    // furthermore, every lieswithin path between resources has to end in an operation resource


    async function rewriteIdentifiersInRelations(relations: Relations,
                                                 find: (identifier: string) => Promise<Document|undefined>,
                                                 identifierMap: { [identifier: string]: string }): Promise<void> {

        return iterateRelationsInImport(relations, async (relation: string, i: number, identifier: string) => {
            if (identifierMap[identifier]) {
                relations[relation][i] = identifierMap[identifier];
            } else {
                const targetDocFromDB = await find(identifier);

                if (!targetDocFromDB) throw [E.MISSING_RELATION_TARGET, identifier];
                relations[relation][i] = targetDocFromDB.resource.id;
            }
        });
    }


    async function assertNoMissingRelationTargets(relations: Relations,
                                                  get: (_: string) => Promise<Document>): Promise<void> {

        return iterateRelationsInImport(relations, async (relation: string, i: number, id: string) => {
            try { await get(id) }
            catch { throw [E.MISSING_RELATION_TARGET, id] }
        });
    }


    async function iterateRelationsInImport(relations: Relations,
                                            asyncIterationFunction: Function): Promise<void> {

        for (let relation of Object.keys(relations)) {
            let i = 0; for (let idOrIdentifier of relations[relation]) { // TODO write asyncForEach (with i)
                await asyncIterationFunction(relation, i, idOrIdentifier); i++;
            }
        }
    }
    

    function validate(document: Document, validator: ImportValidator, mergeMode: boolean): Document {

        if (!mergeMode) {
            validator.assertIsKnownType(document);
            validator.assertIsAllowedType(document, mergeMode);
        }
        validator.assertIsWellformed(document);
        return document;
    }


    function removeSelfReferencingIdentifiers(relations: Relations|undefined, resourceIdentifier: string) {

        if (!relations) return;
        for (let relName of Object.keys(relations)) {
            relations[relName] = relations[relName]
                .filter(relTarget => relTarget !== resourceIdentifier);
            if (isUndefinedOrEmpty(relations[relName])) delete relations[relName];
        }
    }


    /**
     * Generates resource ids of documents in place, for those documents that have none yet
     */
    function assignIds(documents: Array<Document>, generateId: Function) {

        return documents
            .filter(hasNot('resource.id'))
            .reduce((identifierMap, document)  =>
                (identifierMap[document.resource.identifier] = document.resource.id = generateId(), identifierMap)
            , {} as { [identifier: string]: string });
    }


    async function mergeOrUseAsIs(document: NewDocument|Document,
                                  find: (identifier: string) => Promise<Document|undefined>,
                                  mergeIfExists: boolean,
                                  allowOverwriteRelationsOnMerge: boolean): Promise<Document> {

        let documentForUpdate: Document = document as Document;
        const existingDocument = await find(document.resource.identifier);
        if (mergeIfExists) {
            if (existingDocument) documentForUpdate = DocumentMerge.merge(existingDocument, documentForUpdate, allowOverwriteRelationsOnMerge);
            else throw [E.UPDATE_TARGET_NOT_FOUND, document.resource.identifier];
        } else {
            if (existingDocument) throw [E.RESOURCE_EXISTS, existingDocument.resource.identifier];
        }
        return documentForUpdate;
    }


    async function prepareIsRecordedInRelation(documentsForUpdate: Array<NewDocument>,
                                               validator: ImportValidator,
                                               mainTypeDocumentId: string) {

        for (let document of documentsForUpdate) {
            if (!mainTypeDocumentId) {
                try { validator.assertHasLiesWithin(document) }
                catch { throw [E.NO_LIES_WITHIN_SET] }
            } else {
                await validator.assertIsNotOverviewType(document);
                await validator.isRecordedInTargetAllowedRelationDomainType(document, mainTypeDocumentId);
                initRecordedIn(document, mainTypeDocumentId);
            }
        }
    }


    function searchInImport(targetDocumentResourceId: string,
                            documents: Array<Document>,
                            operationTypeNames: string[]
    ): [string|undefined,   // recordedInResourceId
        Document|undefined] // targetDocument
        |undefined {        // targetDocument not found

        let liesWithinTargetInImport = undefined;
        for (let targetInImport of documents) {
            if (targetInImport.resource.id === targetDocumentResourceId) {
                liesWithinTargetInImport = targetInImport;
                if (operationTypeNames.includes(liesWithinTargetInImport.resource.type)) {
                    // TODO delete liesWithin in this case
                    return [liesWithinTargetInImport.resource.id, undefined];
                }
                if (targetInImport.resource.relations.isRecordedIn
                    && targetInImport.resource.relations.isRecordedIn.length > 0) {
                    return [targetInImport.resource.relations.isRecordedIn[0], undefined];
                }
                return [undefined, targetInImport];
            }
        }
    }


    function initRecordedIn(document: NewDocument, mainTypeDocumentId: string) {

        const relations = document.resource.relations;
        if (!relations[RECORDED_IN]) relations[RECORDED_IN] = [];
        if (!relations[RECORDED_IN].includes(mainTypeDocumentId)) {
            relations[RECORDED_IN].push(mainTypeDocumentId);
        }
    }
}