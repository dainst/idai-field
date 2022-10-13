import { and, isEmpty, isDefined, on, to, isUndefinedOrEmpty, not } from 'tsfun';
import { Document, NewDocument, Relation, Resource } from 'idai-field-core';
import { ImportValidator } from './import-validator';
import { ImportErrors as E } from '../import-errors';
import { Get, Id } from '../types';
import { completeInverseRelations } from './complete-inverse-relations';
import { ImportOptions } from '../import-documents';
import { makeLookups } from './make-lookups';
import { inferRecordedIns } from './infer-recorded-ins';
import RECORDEDIN = Relation.Hierarchy.RECORDEDIN;
import LIESWITHIN = Relation.Hierarchy.LIESWITHIN;


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
 * This function takes relations in the form, that only liesWithin is defined and never isRecordedIn.
 * isRecordedIn gets inferred. This especially is true in cases where a top level item references
 * its operation with liesWithin, which gets resolved to an empty liesWithin and a isRecordedIn in its place.
 *
 * Also note:
 *
 * null values in resource fields get interpreted as commands to
 * delete the corresponding fields or relations in merge mode.
 *
 * @author Daniel de Oliveira
 * @author Thomas Kleinke
 */
export async function processRelations(documents: Array<Document>, validator: ImportValidator,
                                       operationCategoryNames: string[], get: Get,
                                       inverseRelationsMap: Relation.InverseRelationsMap,
                                       sameOperationRelations: string[],
                                       { mergeMode, operationId }: ImportOptions) {

    const assertIsAllowedRelationDomainCategory = (domainCategoryName: string, rangeCategoryName: string,
                                                   relationName: string, identifier: string) =>
        validator.assertIsAllowedRelationDomainCategory(domainCategoryName, rangeCategoryName, relationName,
            identifier);

    const [documentsLookup, targetsLookup] = await makeLookups(documents, get, mergeMode);

    await prepareIsRecordedIns(documents, validator, operationCategoryNames, get,
        mergeMode === true, operationId ? operationId : '');

    validator.assertRelationsWellformedness(documents);
    validator.assertLiesWithinCorrectness(documents.map(to('resource')));

    return completeInverseRelations(
        documentsLookup,
        targetsLookup as any,
        inverseRelationsMap,
        sameOperationRelations,
        assertIsAllowedRelationDomainCategory,
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


function makeAssertNoRecordedInMismatch(operationId: Id) {

    return function assertNoRecordedInMismatch(document: Document, compare: string|undefined) {

        const relations = document.resource.relations;
        if (operationId
            && !isUndefinedOrEmpty(relations[RECORDEDIN])
            && relations[RECORDEDIN][0] !== compare
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

    const relationsForDocumentsWhereLiesWithinIsDefined: Array<Resource.Relations> = documents
        .map(to(['resource','relations']))
        .filter(isDefined)
        .filter(on(LIESWITHIN, and(isDefined, not(isEmpty))));

    for (let relations of relationsForDocumentsWhereLiesWithinIsDefined) {

        let liesWithinTarget: Document|undefined = undefined;
        try { liesWithinTarget = await get(relations[LIESWITHIN][0]) } catch {}
        if (!liesWithinTarget || !operationCategoryNames.includes(liesWithinTarget.resource.category)) {
            continue;
        }

        if (operationId) throw [E.PARENT_ASSIGNMENT_TO_OPERATIONS_NOT_ALLOWED];
        relations[RECORDEDIN] = relations[LIESWITHIN];
        delete relations[LIESWITHIN];
    }
}


function initRecordedIn(document: NewDocument, operationId: Id) {

    const relations = document.resource.relations;
    if (!relations[RECORDEDIN]) relations[RECORDEDIN] = [];
    if (!relations[RECORDEDIN].includes(operationId)) {
        relations[RECORDEDIN].push(operationId);
    }
}
