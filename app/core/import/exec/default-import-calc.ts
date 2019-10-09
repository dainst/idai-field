import {ImportValidator} from './import-validator';
import {duplicates, equal, hasNot, includedIn, isArray, sameset,
    isDefined, isNot, isUndefinedOrEmpty, not, to, undefinedOrEmpty, isnt, Either} from 'tsfun';
import {asyncForEach, asyncMap} from 'tsfun-extra';
import {ImportErrors as E} from './import-errors';
import {Relations, NewDocument, Document} from 'idai-components-2';
import {RelationsCompleter} from './relations-completer';
import {DocumentMerge} from './document-merge';
import {RESOURCE_ID, RESOURCE_IDENTIFIER} from '../../../c';
import {HIERARCHICAL_RELATIONS, PARENT} from '../../model/relation-constants';
import LIES_WITHIN = HIERARCHICAL_RELATIONS.LIES_WITHIN;
import RECORDED_IN = HIERARCHICAL_RELATIONS.RECORDED_IN;


/**
 * @author Daniel de Oliveira
 * @author Thomas Kleinke
 */
export module DefaultImportCalc {

    type Get = (resourceId: string) => Promise<Document>;
    type Find = (identifier: string) => Promise<Document|undefined>;
    type GenerateId = () => string;
    type GetInverseRelation = (propertyName: string) => string|undefined;

    type Id = string;
    type IdMap = { [id: string]: Document };
    type Identifier = string;
    type IdentifierMap = { [identifier: string]: string };

    type ImportDocuments = Array<Document>;
    type TargetDocuments = Array<Document>;
    type MsgWithParams = string[];
    type ProcessResult = [ImportDocuments, TargetDocuments, MsgWithParams|undefined];


    export function assertLegalCombination(mainTypeDocumentId: string, mergeMode: boolean) {

        if (mainTypeDocumentId && mergeMode) {
            throw 'FATAL ERROR - illegal argument combination - mainTypeDocumentId and mergeIfExists must not be both truthy';
        }
    }


    export function build(validator: ImportValidator,
                          operationTypeNames: string[],
                          generateId: GenerateId,
                          find: Find,
                          get: Get,
                          getInverseRelation: GetInverseRelation,
                          mergeMode: boolean,
                          allowOverwriteRelationsInMergeMode: boolean,
                          mainTypeDocumentId: Id,
                          useIdentifiersInRelations: boolean) {

        assertLegalCombination(mainTypeDocumentId, mergeMode);

        return async function process(documents: Array<Document>): Promise<ProcessResult> {

            try {
                assertNoDuplicates(documents);

                const identifierMap: IdentifierMap = mergeMode ? {} : assignIds(documents, generateId);
                const rewriteIdentifiersInRels = rewriteIdentifiersInRelations(find, identifierMap);
                const assertNoMissingRelTargets = assertNoMissingRelationTargets(get);

                const preprocessAndValidateRelations_ = preprocessAndValidateRelations(
                    mergeMode,
                    allowOverwriteRelationsInMergeMode,
                    useIdentifiersInRelations,
                    assertNoMissingRelTargets,
                    rewriteIdentifiersInRels);

                const documentsForUpdate = await processDocuments(
                    validator,
                    mergeMode, allowOverwriteRelationsInMergeMode, preprocessAndValidateRelations_,
                    find)(documents);

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
    function processDocuments(validator: ImportValidator,
                              mergeMode: boolean,
                              allowOverwriteRelationsInMergeMode: boolean,
                              preprocessAndValidateRelations: (_: Document) => Promise<Document>,
                              find: Find): (_: Array<Document>) => Promise<Array<Document>> {

        return asyncMap(async (document: Document) => {

            const preprocessedDocument = await preprocessAndValidateRelations(document);

            // we want dropdown fields to be complete before merge
            validator.assertDropdownRangeComplete(preprocessedDocument.resource);

            const possiblyMergedDocument = await mergeOrUseAsIs(
                preprocessedDocument,
                find,
                mergeMode,
                allowOverwriteRelationsInMergeMode);

            return validate(possiblyMergedDocument, validator, mergeMode);
        });
    }


    function assertNoDuplicates(documents: Array<Document>) {

        const dups = duplicates(documents.map(to(RESOURCE_IDENTIFIER)));
        if (dups.length > 0) throw [E.DUPLICATE_IDENTIFIER, dups[0]];
    }


    async function processRelations(documents: Array<Document>,
                                    validator: ImportValidator,
                                    operationTypeNames: string[],
                                    mergeMode: boolean,
                                    allowOverwriteRelationsInMergeMode: boolean,
                                    getInverseRelation: GetInverseRelation,
                                    get: Get,
                                    mainTypeDocumentId: Id) {

        if (!mergeMode) await prepareIsRecordedInRelation(documents, validator, mainTypeDocumentId);
        await replaceTopLevelLiesWithins(documents, operationTypeNames, get, mainTypeDocumentId);
        await inferRecordedIns(documents, operationTypeNames, get, makeAssertNoRecordedInMismatch(mainTypeDocumentId));

        return !mergeMode || allowOverwriteRelationsInMergeMode
            ? await RelationsCompleter
                .completeInverseRelations(get, getInverseRelation)(documents, mergeMode)
            : [];
    }


    function adjustRelations(document: Document, relations: Relations) {

        assertHasNoForbiddenRelations(document);
        const assertIsntArrayRelation = assertIsNotArrayRelation(document);

        Object.keys(document.resource.relations)
            .filter(isnt(PARENT))
            .forEach(assertIsntArrayRelation);

        assertParentNotArray(relations[PARENT], document.resource.identifier);
        if (relations[PARENT]) (relations[LIES_WITHIN] = [relations[PARENT] as any]) && delete relations[PARENT];
    }


    function assertParentNotArray(parentRelation: any, resourceIdentifier: string) {

        if (isArray(parentRelation)) throw [E.PARENT_MUST_NOT_BE_ARRAY, resourceIdentifier];
    }


    function assertHasNoForbiddenRelations(document: Document) {

        const foundForbiddenRelations = Object.keys(document.resource.relations)
            .filter(includedIn(HIERARCHICAL_RELATIONS.ALL))
            .join(', ');
        if (foundForbiddenRelations) throw [E.INVALID_RELATIONS, document.resource.type, foundForbiddenRelations];
    }


    function assertIsNotArrayRelation(document: Document) {

        return (name: string) => {

            if (not(isArray)(document.resource.relations[name])) throw [E.MUST_BE_ARRAY, document.resource.identifier];
        }
    }


    function preprocessAndValidateRelations(mergeMode: boolean,
                                                  allowOverwriteRelationsInMergeMode: boolean,
                                                  useIdentifiersInRelations: boolean,
                                                  assertNoMissingRelTargets: Function,
                                                  rewriteIdentifiersInRelations: Function) {

        return async (document: Document): Promise<Document> => {

            const relations = document.resource.relations;
            if (!relations) return document;

            if (!mergeMode || allowOverwriteRelationsInMergeMode) {

                adjustRelations(document, relations);
            }

            if ((!mergeMode || allowOverwriteRelationsInMergeMode) && useIdentifiersInRelations) {

                removeSelfReferencingIdentifiers(relations, document.resource.identifier);
                await rewriteIdentifiersInRelations(relations);

            } else if (!mergeMode) {

                await assertNoMissingRelTargets(relations);
            }

            return document;
        }
    }


    async function replaceTopLevelLiesWithins(documents: Array<Document>,
                                              operationTypeNames: string[],
                                              get: Get,
                                              mainTypeDocumentId: Id) {

        for (let document of documents) {
            const relations = document.resource.relations;
            if (!relations || !relations[LIES_WITHIN]) continue;

            let liesWithinTarget = undefined;
            try { liesWithinTarget = await get(relations[LIES_WITHIN][0]) } catch {}
            if (!liesWithinTarget || !operationTypeNames.includes(liesWithinTarget.resource.type)) continue;

            if (mainTypeDocumentId) throw [E.PARENT_ASSIGNMENT_TO_OPERATIONS_NOT_ALLOWED];
            relations[RECORDED_IN] = relations[LIES_WITHIN];
            delete relations[LIES_WITHIN];
        }
    }


    /**
     * Sets RECORDED_IN relations in documents, as inferred from LIES_WITHIN.
     * Where a document is situated at the top level, i.e. directly below an operation,
     * the LIES_WITHIN entry gets deleted.
     *
     * @param documents get modified in place
     * @param operationTypeNames
     * @param get
     * @param assertNoRecordedInMismatch
     *
     * @throws [LIES_WITHIN_TARGET_NOT_MATCHES_ON_IS_RECORDED_IN, resourceIdentifier] if the inferredRecordedIn
     *   differs from a possibly specified recordedIn.
     */
    async function inferRecordedIns(documents: Array<Document>,
                                    operationTypeNames: string[],
                                    get: Get,
                                    assertNoRecordedInMismatch: (document: Document,
                                                                 inferredRecordedIn: string|undefined) => void) {

        const idMap = documents.reduce((tmpMap, document: Document) => {
                tmpMap[document.resource.id] = document;
                return tmpMap;
            },
            {} as IdMap);


        async function getRecordedInFromImportDocument(liesWithinTargetInImport: any) {
            if (liesWithinTargetInImport[0]) return liesWithinTargetInImport[0];

            const target = liesWithinTargetInImport[1] as Document;
            if (isNot(undefinedOrEmpty)((target.resource.relations[LIES_WITHIN]))) return determineRecordedInValueFor(target);
        }


        async function getRecordedInFromExistingDocument(targetId: Id) {

            try {
                const got = await get(targetId);
                return  operationTypeNames.includes(got.resource.type)
                    ? got.resource.id
                    : got.resource.relations[RECORDED_IN][0];
            } catch { console.log("FATAL - not found") } // should have been caught earlier, in processDocuments
        }


        async function determineRecordedInValueFor(document: Document): Promise<string|undefined> {

            const relations = document.resource.relations;
            if (!relations || isUndefinedOrEmpty(relations[LIES_WITHIN])) return;

            const liesWithinTargetInImport = searchInImport(relations[LIES_WITHIN][0], idMap, operationTypeNames);
            return liesWithinTargetInImport
                ? getRecordedInFromImportDocument(liesWithinTargetInImport)
                : getRecordedInFromExistingDocument(relations[LIES_WITHIN][0]);
        }


        for (let document of documents) {

            const inferredRecordedIn = await determineRecordedInValueFor(document);
            assertNoRecordedInMismatch(document, inferredRecordedIn);

            const relations = document.resource.relations;
            if (inferredRecordedIn) relations[RECORDED_IN] = [inferredRecordedIn];
            if (relations
                && sameset(relations[RECORDED_IN])(relations[LIES_WITHIN] ? relations[LIES_WITHIN] : [])) {

                delete relations[LIES_WITHIN];
            }
        }
    }


    function makeAssertNoRecordedInMismatch(mainTypeDocumentId: Id) {

        return function assertNoRecordedInMismatch(document: Document, compare: string|undefined) {

            const relations = document.resource.relations;
            if (mainTypeDocumentId
                && isNot(undefinedOrEmpty)(relations[RECORDED_IN])
                && relations[RECORDED_IN][0] !== compare
                && isDefined(compare)) {
                throw [E.LIES_WITHIN_TARGET_NOT_MATCHES_ON_IS_RECORDED_IN, document.resource.identifier];
            }
        }
    }


    function rewriteIdentifiersInRelations(find: Find,
                                           identifierMap: IdentifierMap) {

        return async (relations: Relations): Promise<void> => {

            return iterateRelationsInImport(relations, (relation: string) => async (identifier: Identifier, i: number) => {
                if (identifierMap[identifier]) {
                    relations[relation][i] = identifierMap[identifier];
                } else {
                    const _ = await find(identifier);
                    if (!_) throw [E.MISSING_RELATION_TARGET, identifier];
                    relations[relation][i] = _.resource.id;
                }
            });
        }
    }


    function assertNoMissingRelationTargets(get: Get) {

        return async (relations: Relations): Promise<void> => {

            return iterateRelationsInImport(relations,
                (_: never) => async (id: Id, _: never) => {

                try { await get(id) }
                catch { throw [E.MISSING_RELATION_TARGET, id] }
            });
        }
    }


    async function iterateRelationsInImport(
        relations: Relations,
        asyncIterationFunction: (relation: string) => (idOrIdentifier: Id|Identifier, i: number) => Promise<void>): Promise<void> {

        for (let relation of Object.keys(relations)) {
            await asyncForEach(asyncIterationFunction(relation))(relations[relation]);
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


    function removeSelfReferencingIdentifiers(relations: Relations, resourceIdentifier: Identifier) {

        for (let relName of Object.keys(relations)) {
            relations[relName] = relations[relName].filter(isnt(resourceIdentifier));
            if (isUndefinedOrEmpty(relations[relName])) delete relations[relName];
        }
    }


    function assignIds(documents: Array<Document>, generateId: Function): IdentifierMap {

        return documents
            .filter(hasNot(RESOURCE_ID))
            .reduce((identifierMap, document)  => {
                identifierMap[document.resource.identifier] = document.resource.id = generateId();
                return identifierMap;
            }, {} as IdentifierMap);
    }


    async function mergeOrUseAsIs(document: NewDocument|Document,
                                  find: Find,
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
                                               mainTypeDocumentId: Id) {

        for (let document of documentsForUpdate) {
            if (!mainTypeDocumentId) {
                validator.assertHasLiesWithin(document);
            } else {
                await validator.assertIsNotOverviewType(document);
                await validator.isRecordedInTargetAllowedRelationDomainType(document, mainTypeDocumentId);
                initRecordedIn(document, mainTypeDocumentId);
            }
        }
    }


    function searchInImport(targetDocumentResourceId: Id,
                            idMap: IdMap,
                            operationTypeNames: string[]
    ): Either<string, Document> // recordedInResourceId|targetDocument
       |undefined {             // targetDocument not found

        const targetInImport = idMap[targetDocumentResourceId];
        if (!targetInImport) return undefined;

        if (operationTypeNames.includes(targetInImport.resource.type)) {
            return [targetInImport.resource.id, undefined];
        }
        if (targetInImport.resource.relations.isRecordedIn
            && targetInImport.resource.relations.isRecordedIn.length > 0) {
            return [targetInImport.resource.relations.isRecordedIn[0], undefined];
        }
        return [undefined, targetInImport];
    }


    function initRecordedIn(document: NewDocument, mainTypeDocumentId: Id) {

        const relations = document.resource.relations;
        if (!relations[RECORDED_IN]) relations[RECORDED_IN] = [];
        if (!relations[RECORDED_IN].includes(mainTypeDocumentId)) {
            relations[RECORDED_IN].push(mainTypeDocumentId);
        }
    }
}