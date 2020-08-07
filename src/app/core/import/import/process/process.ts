import {duplicates, to} from 'tsfun';
import {assoc} from 'tsfun/associative';
import {Document} from 'idai-components-2';
import {ImportValidator} from './import-validator';
import {ImportErrors as E} from '../import-errors';
import {RESOURCE_IDENTIFIER} from '../../../constants';
import {processRelations} from './process-relations';
import {Get} from '../types';
import {assertLegalCombination} from '../utils';
import {ImportOptions} from '../import-documents';
import {mergeResource} from './merge-resource';
import {InverseRelationsMap} from '../../../configuration/inverse-relations-map';


/**
 * null values in resource fields get interpreted as commands to
 * delete the corresponding fields or relations in merge mode.
 *
 * This function takes relations in the form, that only liesWithin is defined and never isRecordedIn.
 * isRecordedIn gets inferred. This especially is true in cases where a top level item references
 * its operation with liesWithin, which gets resolved to an empty liesWithin and a isRecordedIn in its place.
 *
 * -------------------------------------------------------
 * @returns an array with 3 entries
 *   [
 *     the documents, prepared such that database updates can be performed,
 *     related documents, with adjusted relations so that the database will be consistent after update,
 *     ImportErrors, if any
 *   ]
 *
 *   Possibly occuring ImportErrors:
 *
 *   [MUST_LIE_WITHIN_OTHER_NON_OPERATON_RESOURCE, category, resourceIdentifier]
 *     - if a resource of
 *       a defined builtin category should be placed inside another resource of a legal LIES_WITHIN range category, but is placed
 *       directly below an operation.
 *
 *   [BAD_INTERRELATION, sourceId]
 *     - if opposing relations are pointing to the same resource.
 *       For example IS_BEFORE and IS_AFTER pointing both from document '1' to '2'.
 *     - if mutually exluding relations are pointing to the same resource.
 *       For example IS_CONTEMPORARY_WITH and IS_AFTER both from document '1' to '2'.
 *
 *   [TARGET_CATEGORY_RANGE_MISMATCH, resourceIdentifier, relationName, relationTargetCategory]
 *     - if a resource points to another resource, however, the specified relation is not allowed between the
 *       categories of the resources.
 *
 *   [PARENT_ASSIGNMENT_TO_OPERATIONS_NOT_ALLOWED]
 *     - if operationId is not '' and
 *       a resource references an operation as parent.
 *
 *   [LIES_WITHIN_TARGET_NOT_MATCHES_ON_IS_RECORDED_IN, resourceIdentifier]
 *     - if the inferredRecordedIn
 *       differs from a possibly specified recordedIn.
 *
 *   [EXEC_MISSING_RELATION_TARGET, targetId]
 *
 * [CATEGORY_CANNOT_BE_CHANGED, identifier]
 *   - if it is tried to change the category of a resource
 *
 * [EMPTY_SLOTS_IN_ARRAYS_FORBIDDEN, identifier]
 *   - if deletion would result in empty array slots
 *
 * [ARRAY_OF_HETEROGENEOUS_TYPES, identifier]
 *
 * [EMPTY_RELATION, resourceId]
 *   - if relations empty for some relation is empty.
 *     For example relations: {isAbove: []}
 *
 *  @author Daniel de Oliveira
 *  @author Thomas Kleinke
 */
export async function process(documents: Array<Document>,
                              mergeDocs: { [resourceId: string]: Document },
                              validator: ImportValidator,
                              operationCategoryNames: string[],
                              get: Get,
                              inverseRelationsMap: InverseRelationsMap,
                              importOptions: ImportOptions = {})
        : Promise<[Array<Document>, Array<Document>, string[]|undefined]> {

    assertLegalCombination(importOptions.mergeMode, importOptions.operationId);

    try {
        if (!importOptions.mergeMode) assertNoDuplicates(documents);

        const processedDocuments = processDocuments(documents, mergeDocs, validator);

        const relatedDocuments = await processRelations(
            processedDocuments,
            validator,
            operationCategoryNames,
            inverseRelationsMap,
            get,
            importOptions
        );

        return [processedDocuments, relatedDocuments, undefined];

    } catch (errWithParams) {

        return [[],[], errWithParams];
    }
}


function assertNoDuplicates(documents: Array<Document>) {

    const dups = duplicates(documents.map(to(RESOURCE_IDENTIFIER)));
    if (dups.length > 0) throw [E.DUPLICATE_IDENTIFIER, dups[0]];
}


/**
 * @returns clones of the documents with their properties validated and adjusted
 */
// TODO test manually: it seems it hangs on corrupt json instead of displaying error
function processDocuments(documents: Array<Document>,
                          mergeDocs: { [resourceId: string]: Document },
                          validator: ImportValidator): Array<Document> {

    const mergeMode = Object.keys(mergeDocs).length > 0;
    const finalDocuments = {};

    for (const document of documents) {

        // TODO review dropdown fields
        validator.assertDropdownRangeComplete(document.resource); // we want dropdown fields to be complete before merge
        if (!mergeMode) validator.assertIsKnownCategory(document);

        let finalDocument;
        if (mergeMode) {
            const mergeTarget = finalDocuments[document.resource.id] ?? mergeDocs[document.resource.id];
            if (!mergeTarget) throw 'FATAL - in process.ts: no merge target';
            const mergedResource = mergeResource(mergeTarget.resource, document.resource);
            finalDocument = assoc(Document.RESOURCE, mergedResource)(mergeTarget);
        } else {
            finalDocument = document;
        }
        finalDocuments[finalDocument.resource.id] = finalDocument;

        // While we want to leave existing documents' fields as they come from the database,
        // we do test for fields of import document if they are defined.
        // We need to make sure the category is set in any case.
        document.resource.category = finalDocument.resource.category;
        validator.assertFieldsDefined(document);

        if (!mergeMode) validator.assertIsAllowedCategory(finalDocument);
        validator.assertIsWellformed(finalDocument);
    }

    return Object.values(finalDocuments);
}
