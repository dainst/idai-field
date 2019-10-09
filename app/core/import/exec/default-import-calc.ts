import {ImportValidator} from './import-validator';
import {duplicates, hasNot, includedIn, isArray, isnt, isUndefinedOrEmpty, not, to} from 'tsfun';
import {asyncForEach} from 'tsfun-extra';
import {ImportErrors as E} from './import-errors';
import {Document, Relations} from 'idai-components-2';
import {RESOURCE_ID, RESOURCE_IDENTIFIER} from '../../../c';
import {HIERARCHICAL_RELATIONS, PARENT} from '../../model/relation-constants';
import {processRelations} from './process-relations';
import {Find, GenerateId, Get, GetInverseRelation, Id, Identifier, IdentifierMap, ProcessResult} from './utils';
import {processDocuments} from './process-documents';
import LIES_WITHIN = HIERARCHICAL_RELATIONS.LIES_WITHIN;


/**
 * @author Daniel de Oliveira
 * @author Thomas Kleinke
 */
export module DefaultImportCalc {


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

        /**
         * ImportErrors (accessible via ProcessResult)
         *
         * [MUST_LIE_WITHIN_OTHER_NON_OPERATON_RESOURCE, resourceType, resourceIdentifier]
         *   - if a resource of
         *     a defined builtin type should be placed inside another resource of a legal LIES_WITHIN range type, but is placed
         *     directly below an operation.
         *
         * [BAD_INTERRELATION, sourceId]
         *   - if opposing relations are pointing to the same resource.
         *     For example IS_BEFORE and IS_AFTER pointing both from document '1' to '2'.
         *   - if mutually exluding relations are pointing to the same resource.
         *     For example IS_CONTEMPORARY_WITH and IS_AFTER both from document '1' to '2'.
         *
         * [TARGET_TYPE_RANGE_MISMATCH]
         *   - if a resource points to another resource, however, the specified relation is not allowed between the
         *     types of the resources.
         *
         * [PARENT_ASSIGNMENT_TO_OPERATIONS_NOT_ALLOWED]
         *   - if mainTypeDocumentId is not '' and
         *     a resource references an operation as parent.
         *
         * [LIES_WITHIN_TARGET_NOT_MATCHES_ON_IS_RECORDED_IN, resourceIdentifier]
         *   - if the inferredRecordedIn
         *     differs from a possibly specified recordedIn.
         *
         * [EXEC_MISSING_RELATION_TARGET, targetId]
         *
         * @throws [EMPTY_RELATION, resourceId]
         *   - if relations empty for some relation is empty.
         *     For example relations: {isAbove: []}
         */
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
                    getInverseRelation,
                    get,
                    mainTypeDocumentId);

                return [documentsForUpdate, relatedDocuments, undefined];

            } catch (errWithParams) {

                return [[],[], errWithParams];
            }
        }
    }



    function assertNoDuplicates(documents: Array<Document>) {

        const dups = duplicates(documents.map(to(RESOURCE_IDENTIFIER)));
        if (dups.length > 0) throw [E.DUPLICATE_IDENTIFIER, dups[0]];
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
}