import {Document} from "idai-components-2/src/model/core/document";
import {ImportValidator} from "./import-validator";
import {duplicates, hasNot, isUndefinedOrEmpty, to, arrayEqual} from "tsfun";
import {ImportErrors} from "./import-errors";
import {Relations} from "idai-components-2/src/model/core/relations";
import {RelationsCompleter} from "./relations-completer";
import {NewDocument} from "idai-components-2/src/model/core/new-document";
import {DocumentMerge} from "./document-merge";


/**
 * @author Daniel de Oliveira
 * @author Thomas Kleinke
 */
export module DefaultImportCalc {


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

        return async function process(documents: Array<Document>) {

            const documentsForUpdate = await processDocuments(
                documents,
                validator,
                mergeMode, allowOverwriteRelationsInMergeMode, useIdentifiersInRelations,
                find, generateId);

            const relatedDocuments = await processRelations(
                documentsForUpdate,
                validator, operationTypeNames,
                mergeMode, allowOverwriteRelationsInMergeMode,
                getInverseRelation, get,
                mainTypeDocumentId);

            return [documentsForUpdate, relatedDocuments];
        }
    }


    /**
     * Assigns ids if necessary.
     * Rewrites relations in identifiers.
     * Does validations, mostly of structural nature, most of relation validation is done later.
     * Merges with existing documents from db if necessary.
     */
    async function processDocuments(documents: Array<Document>,
                                    validator: ImportValidator,
                                    mergeMode: boolean,
                                    allowOverwriteRelationsInMergeMode: boolean,
                                    useIdentifiersInRelations: boolean,
                                    find: (identifier: string) => Promise<Document|undefined>,
                                    generateId: () => string): Promise<Array<Document>> {

        /**
         * Rewrites the relations of document in place
         */
        async function rewriteIdentifiersInRelations(relations: Relations) {

            for (let relation of Object.keys(relations)) {

                let i = 0;
                for (let identifier of relations[relation]) {

                    if (identifierMap[identifier]) {
                        relations[relation][i] = identifierMap[identifier];
                    } else {
                        const targetDocFromDB = await find(identifier);
                        if (!targetDocFromDB) throw [ImportErrors.MISSING_RELATION_TARGET, identifier];
                        relations[relation][i] = targetDocFromDB.resource.id;
                    }
                    i++;
                }
            }
        }

        async function preprocessAndValidateRelations(document: Document /* new document possibly without relations */) {

            if (!document.resource.relations) return;
            const relations = document.resource.relations;
            
            // assertNoForbiddenRelations
            const forbidden = [];
            if (relations['liesWithin'] !== undefined) forbidden.push('liesWithin');
            if (relations['includes'] !== undefined) forbidden.push('includes');
            if (relations['isRecordedIn'] !== undefined) forbidden.push('isRecordedIn');
            
            if (forbidden.length > 0) throw [
                ImportErrors.INVALID_RELATIONS,
                document.resource.type,
                forbidden.join(', ')
            ];
            // -

            if (relations && relations['parent']) {
                // TODO validate that parent value is not an array
                relations['liesWithin'] = [relations['parent'] as any];
                delete relations['parent'];
            }

            if ((!mergeMode || allowOverwriteRelationsInMergeMode)  && useIdentifiersInRelations) {
                removeSelfReferencingIdentifiers(relations, document.resource.identifier);
                await rewriteIdentifiersInRelations(relations);
            }
        }

        function validate(document: Document) {

            if (!mergeMode) {
                validator.assertIsKnownType(document);
                validator.assertIsAllowedType(document, mergeMode);
            }
            validator.assertIsWellformed(document);
            return document;
        }


        const duplicates_ = duplicates(documents.map(to('resource.identifier')));

        if (duplicates_.length > 0) throw [ImportErrors.DUPLICATE_IDENTIFIER, duplicates_[0]];
        const identifierMap: { [identifier: string]: string } = mergeMode ? {} : assignIds(documents, generateId);

        const documentsForUpdate: Array<Document> = [];
        for (let document of documents) {

            await preprocessAndValidateRelations(document);
            documentsForUpdate.push(validate(await mergeOrUseAsIs(
                document, find, mergeMode, allowOverwriteRelationsInMergeMode)));
        }
        return documentsForUpdate;
    }


    function removeSelfReferencingIdentifiers(relations: Relations|undefined, resourceIdentifier: string) {

        if (!relations) return;
        for (let relName of Object.keys(relations)) {
            relations[relName] = relations[relName]
                .filter(relTarget => relTarget !== resourceIdentifier);
            if (isUndefinedOrEmpty(relations[relName])) delete relations[relName];
        }
    }


    async function processRelations(documents: Array<Document>,
                                    validator: ImportValidator,
                                    operationTypeNames: string[],
                                    mergeMode: boolean,
                                    allowOverwriteRelationsInMergeMode: boolean,
                                    getInverseRelation: (_: string) => string|undefined,
                                    get: (_: string) => Promise<Document>,
                                    mainTypeDocumentId: string) {

        // TODO replace traversal of documents with hash based access and also look for existing docs if not found in import
        function setRecordedIns(document: Document): string|undefined {

            if (!document.resource.relations
                || !document.resource.relations['liesWithin']
                || document.resource.relations['liesWithin'].length === 0) return;
            if (document.resource.relations['isRecordedIn'] && document.resource.relations['isRecordedIn'].length > 0) return;

            let liesWithinTargetInImport = undefined;
            for (let targetInImport of documents) {
                if (targetInImport.resource.id === document.resource.relations['liesWithin'][0]) {
                    liesWithinTargetInImport = targetInImport;
                    if (operationTypeNames.includes(liesWithinTargetInImport.resource.type)) {
                        // TODO delete liesWithin in this case
                        return liesWithinTargetInImport.resource.id;
                    }
                    if (targetInImport.resource.relations.isRecordedIn
                        && targetInImport.resource.relations.isRecordedIn.length > 0) {
                        return targetInImport.resource.relations.isRecordedIn[0];
                    }
                }
            }

            if (document.resource.relations['liesWithin']
                && document.resource.relations['liesWithin'].length > 0
                && liesWithinTargetInImport) {

                return setRecordedIns(liesWithinTargetInImport);
            }
        }

        let relatedDocuments: Array<Document> = [];
        if (!mergeMode) await prepareIsRecordedInRelation(documents, validator, mainTypeDocumentId);

        if (!mainTypeDocumentId) await replaceTopLevelLiesWithins(documents, operationTypeNames, get); // TODO throw an error if top level lies within found and maintypedocumentid is set
        // if (!arrayEqual(liesWithinTarget.resource.relations['isRecordedIn'])(document.resource.relations['isRecordedIn'])) {
        //     throw [ImportErrors.LIES_WITHIN_TARGET_NOT_MATCHES_ON_IS_RECORDED_IN, document.resource.identifier];
        // }


        if (!mergeMode || allowOverwriteRelationsInMergeMode) {
            relatedDocuments = await RelationsCompleter.completeInverseRelations(
                documents,
                get, getInverseRelation,
                mergeMode);
        }
        if (!mainTypeDocumentId) for (let document of documents) {
            const result = setRecordedIns(document);
            if (result) document.resource.relations['isRecordedIn'] = [result];

            if (document.resource.relations && document.resource.relations['liesWithin'] && document.resource.relations['isRecordedIn'] &&

                arrayEqual(document.resource.relations['isRecordedIn'])(document.resource.relations['liesWithin'])) {
                delete document.resource.relations['liesWithin'];
            }
        }

        // TODO every resource has to have a lies within relation
        // furthermore, every lieswithin path between resources has to end in an operation resource
        return relatedDocuments;
    }


    async function replaceTopLevelLiesWithins(documents: Array<Document>,
                                              operationTypeNames: string[],
                                              get: (_: string) => Promise<Document>) {

        for (let document of documents) {

            if (!document.resource.relations || !document.resource.relations['liesWithin']) continue;
            if (document.resource.relations['liesWithin'].length > 1) {
                throw "only one lies within target allowed"; // TODO throw errWithParams, do it in assertNoForbiddenRelations and rename that to assertRelationsLegal
            }

            let liesWithinTarget = undefined;
            try { liesWithinTarget = await get(document.resource.relations['liesWithin'][0]) } catch {}
            if (liesWithinTarget && operationTypeNames.includes(liesWithinTarget.resource.type)) {
                document.resource.relations['isRecordedIn'] = document.resource.relations['liesWithin'];
                delete document.resource.relations['liesWithin'];
            }
        }
    }


    /**
     * Generates resource ids of documents in place, for those documents that have none yet
     */
    function assignIds(documents: Array<Document>, generateId: Function) {

        return documents
            .filter(hasNot('resource.id'))
            .reduce((identifierMap: { [identifier: string]: string }, document)  => {
                const uuid = generateId();
                document.resource.id = uuid;
                identifierMap[document.resource.identifier] = uuid;
                return identifierMap;
            }, {});
    }


    async function mergeOrUseAsIs(document: NewDocument|Document,
                                  find: (identifier: string) => Promise<Document|undefined>,
                                  mergeIfExists: boolean,
                                  allowOverwriteRelationsOnMerge: boolean): Promise<Document> {

        let documentForUpdate: Document = document as Document;
        const existingDocument = await find(document.resource.identifier);
        if (mergeIfExists) {
            if (existingDocument) documentForUpdate = DocumentMerge.merge(existingDocument, documentForUpdate, allowOverwriteRelationsOnMerge);
            else throw [ImportErrors.UPDATE_TARGET_NOT_FOUND, document.resource.identifier];
        } else {
            if (existingDocument) throw [ImportErrors.RESOURCE_EXISTS, existingDocument.resource.identifier];
        }
        return documentForUpdate;
    }


    async function prepareIsRecordedInRelation(documentsForUpdate: Array<NewDocument>,
                                               validator: ImportValidator,
                                               mainTypeDocumentId: string) {

        for (let document of documentsForUpdate) {
            if (!mainTypeDocumentId) {
                try { validator.assertHasLiesWithin(document) }
                catch { throw [ImportErrors.NO_LIES_WITHIN_SET] }
            } else {
                await validator.assertIsNotOverviewType(document);
                await validator.isRecordedInTargetAllowedRelationDomainType(document, mainTypeDocumentId);
                initRecordedIn(document, mainTypeDocumentId);
            }
        }
    }


    function initRecordedIn(document: NewDocument, mainTypeDocumentId: string) {

        const relations = document.resource.relations;
        if (!relations['isRecordedIn']) relations['isRecordedIn'] = [];
        if (!relations['isRecordedIn'].includes(mainTypeDocumentId)) {
            relations['isRecordedIn'].push(mainTypeDocumentId);
        }
    }
}