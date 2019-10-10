import {ImportValidator} from './import-validator';
import {duplicates, to} from 'tsfun';
import {ImportErrors as E} from './import-errors';
import {Document} from 'idai-components-2';
import {RESOURCE_IDENTIFIER} from '../../../c';
import {processRelations} from './process-relations';
import {Find, Get, GetInverseRelation, Id, ProcessResult} from './types';
import {processDocuments} from './process-documents';
import {assertLegalCombination} from './utils';


/**
 * @author Daniel de Oliveira
 * @author Thomas Kleinke
 */
export function build(validator: ImportValidator,
                      operationTypeNames: string[],
                      find: Find,
                      get: Get,
                      getInverseRelation: GetInverseRelation,
                      mergeMode: boolean,
                      allowOverwriteRelationsInMergeMode: boolean,
                      mainTypeDocumentId: Id) {

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
     * [TARGET_TYPE_RANGE_MISMATCH, resourceIdentifier, relationName, relationTargetResourceType]
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

            const processedDocuments = await processDocuments(
                validator, mergeMode, allowOverwriteRelationsInMergeMode, find)(documents);

            const relatedDocuments = await processRelations(
                processedDocuments,
                validator,
                operationTypeNames,
                mergeMode,
                allowOverwriteRelationsInMergeMode,
                getInverseRelation,
                get,
                mainTypeDocumentId);

            return [processedDocuments, relatedDocuments, undefined];

        } catch (errWithParams) {

            return [[],[], errWithParams];
        }
    }
}



function assertNoDuplicates(documents: Array<Document>) {

    const dups = duplicates(documents.map(to(RESOURCE_IDENTIFIER)));
    if (dups.length > 0) throw [E.DUPLICATE_IDENTIFIER, dups[0]];
}



