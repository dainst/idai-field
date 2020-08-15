import {
    and,
    Either,
    empty,
    isDefined,
    isNot,
    isUndefinedOrEmpty,
    on,
    sameset,
    to,
    undefinedOrEmpty
} from 'tsfun';
import {Document, NewDocument, Relations} from 'idai-components-2';
import {ImportValidator} from './import-validator';
import {ImportErrors as E} from '../import-errors';
import {HierarchicalRelations} from '../../../model/relation-constants';
import {Get, Id, IdMap} from '../types';
import {completeInverseRelations} from './complete-inverse-relations';
import {ImportOptions} from '../import-documents';
import {InverseRelationsMap} from '../../../configuration/inverse-relations-map';
import {makeLookups} from './make-lookups';
import LIES_WITHIN = HierarchicalRelations.LIESWITHIN;
import RECORDED_IN = HierarchicalRelations.RECORDEDIN;


/**
 * Prerequisites:
 *
 * This function expects
 * - relation targets to be resource ids (not identifiers)
 * - relation targets to be of type Array<string>
 *
 * The relation targets can be either
 * - documents to be imported => accessible in documents parameter
 * - existing documents => accessible via get
 *
 * Does:
 *
 * LIES_WITHIN gets replaced by or joined by RECORDED_IN relations.
 *
 * @param documents get modified in place (document.resource.relations)
 * @param validator
 * @param operationCategoryNames
 * @param inverseRelationsMap
 * @param get
 * @param mergeMode
 * @param permitDeletions
 * @param mainTypeDocumentId
 *
 * @author Daniel de Oliveira
 * @author Thomas Kleinke
 *
 *
 *
 * TODO migrated doc, review:
 *
 *  * null values in resource fields get interpreted as commands to
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
 */
export async function processRelations(documents: Array<Document>, validator: ImportValidator,
                                       operationCategoryNames: string[],
                                       get: Get, // TODO make function synchronous
                                       inverseRelationsMap: InverseRelationsMap,
                                       { mergeMode, permitDeletions, operationId }: ImportOptions) {

    const assertIsAllowedRelationDomainCategory_ = (_: any, __: any, ___: any, ____: any) =>
        validator.assertIsAllowedRelationDomainCategory(_, __, ___, ____);

    const [documentsLookup, targetsLookup] = await makeLookups(documents, get, mergeMode);

    // TODO make synchronous
    await prepareIsRecordedIns(documents, validator, operationCategoryNames, get,
        mergeMode === true, operationId ? operationId : '');

    validator.assertRelationsWellformedness(documents);
    validator.assertLiesWithinCorrectness(documents.map(to('resource')));

    return completeInverseRelations(
            documentsLookup,
            targetsLookup as any,
            inverseRelationsMap,
            assertIsAllowedRelationDomainCategory_,
            mergeMode);
}


async function prepareIsRecordedIns(documents: Array<Document>, validator: ImportValidator,
                                    operationCategoryNames: string[], get: Get, mergeMode: boolean,
                                    operationId: string) {

    if (!mergeMode) {
        await validateIsRecordedInRelation(documents, validator, operationId);
        prepareIsRecordedInRelation(documents, operationId);
    }
    await replaceTopLevelLiesWithins(documents, operationCategoryNames, get, operationId);
    await inferRecordedIns(documents, operationCategoryNames, get, makeAssertNoRecordedInMismatch(operationId));
}


async function validateIsRecordedInRelation(documentsForUpdate: Array<NewDocument>,
                                            validator: ImportValidator, operationId: Id) {

    for (let document of documentsForUpdate) {
        if (!operationId) {
            validator.assertHasLiesWithin(document);
        } else {
            await validator.assertIsNotOverviewCategory(document);
            await validator.isRecordedInTargetAllowedRelationDomainCategory(document, operationId);
        }
    }
}


function prepareIsRecordedInRelation(documentsForUpdate: Array<NewDocument>, operationId: Id) {

    if (operationId) {
        for (let document of documentsForUpdate) initRecordedIn(document, operationId);
    }
}


/**
 * TODO review; perhaps move to its own function file
 *
 *
 * Sets RECORDED_IN relations in documents, as inferred from LIES_WITHIN.
 * Where a document is situated at the top level, i.e. directly below an operation,
 * the LIES_WITHIN entry gets deleted.
 *
 * documents get modified in place
 */
async function inferRecordedIns(documents: Array<Document>, operationCategoryNames: string[], get: Get,
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
            return  operationCategoryNames.includes(got.resource.category)
                ? got.resource.id
                : got.resource.relations[RECORDED_IN][0];
        } catch { console.log('FATAL: Not found'); } // should have been caught earlier, in process()
    }


    async function determineRecordedInValueFor(document: Document): Promise<string|undefined> {

        const relations = document.resource.relations;
        if (!relations || isUndefinedOrEmpty(relations[LIES_WITHIN])) return;

        const liesWithinTargetInImport = searchInImport(relations[LIES_WITHIN][0], idMap, operationCategoryNames);
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
            && relations[LIES_WITHIN]
            && relations[RECORDED_IN]
            && sameset(relations[LIES_WITHIN])(relations[RECORDED_IN])) {

            delete relations[LIES_WITHIN];
        }
    }
}


function makeAssertNoRecordedInMismatch(operationId: Id) {

    return function assertNoRecordedInMismatch(document: Document, compare: string|undefined) {

        const relations = document.resource.relations;
        if (operationId
            && isNot(undefinedOrEmpty)(relations[RECORDED_IN])
            && relations[RECORDED_IN][0] !== compare
            && isDefined(compare)) {
            throw [E.LIES_WITHIN_TARGET_NOT_MATCHES_ON_IS_RECORDED_IN, document.resource.identifier];
        }
    }
}



/**
 * Replaces LIES_WITHIN entries with RECORDED_IN entries where operation category documents
 * are referenced.
 *
 * documents get modified in place
 */
async function replaceTopLevelLiesWithins(documents: Array<Document>, operationCategoryNames: string[],
                                          get: Get, operationId: Id) {

    const relationsForDocumentsWhereLiesWithinIsDefined: Array<Relations> = documents
        .map(to('resource.relations'))
        .filter(isDefined)
        .filter(on(LIES_WITHIN, and(isDefined, isNot(empty))));

    for (let relations of relationsForDocumentsWhereLiesWithinIsDefined) {

        let liesWithinTarget: Document|undefined = undefined;
        try { liesWithinTarget = await get(relations[LIES_WITHIN][0]) } catch {}
        if (!liesWithinTarget || !operationCategoryNames.includes(liesWithinTarget.resource.category)) {
            continue;
        }

        if (operationId) throw [E.PARENT_ASSIGNMENT_TO_OPERATIONS_NOT_ALLOWED];
        relations[RECORDED_IN] = relations[LIES_WITHIN];
        delete relations[LIES_WITHIN];
    }
}


function searchInImport(targetDocumentResourceId: Id, idMap: IdMap, operationCategoryNames: string[]
        ): Either<string, Document> // recordedInResourceId|targetDocument
        |undefined {                // targetDocument not found

    const targetInImport = idMap[targetDocumentResourceId];
    if (!targetInImport) return undefined;

    if (operationCategoryNames.includes(targetInImport.resource.category)) {
        return [targetInImport.resource.id, undefined];
    }
    if (targetInImport.resource.relations.isRecordedIn
        && targetInImport.resource.relations.isRecordedIn.length > 0) {
        return [targetInImport.resource.relations.isRecordedIn[0], undefined];
    }
    return [undefined, targetInImport];
}


function initRecordedIn(document: NewDocument, operationId: Id) {

    const relations = document.resource.relations;
    if (!relations[RECORDED_IN]) relations[RECORDED_IN] = [];
    if (!relations[RECORDED_IN].includes(operationId)) {
        relations[RECORDED_IN].push(operationId);
    }
}
