import {Document} from 'idai-components-2/src/model/core/document';
import {ImportValidator} from './import-validator';
import {NewDocument} from 'idai-components-2/src/model/core/new-document';
import {and, Either, empty, isDefined, isNot, isUndefinedOrEmpty, on, sameset, to, undefinedOrEmpty} from 'tsfun';
import {ImportErrors as E} from './import-errors';
import {HIERARCHICAL_RELATIONS} from '../../model/relation-constants';
import LIES_WITHIN = HIERARCHICAL_RELATIONS.LIES_WITHIN;
import RECORDED_IN = HIERARCHICAL_RELATIONS.RECORDED_IN;
import {Relations} from 'idai-components-2/src/model/core/relations';
import {Get, GetInverseRelation, Id, IdMap} from './utils';
import {completeInverseRelations} from './complete-inverse-relations';





export async function processRelations(documents: Array<Document>,
                                       validator: ImportValidator,
                                       operationTypeNames: string[],
                                       mergeMode: boolean,
                                       allowOverwriteRelationsInMergeMode: boolean,
                                       getInverseRelation: GetInverseRelation, get: Get,
                                       mainTypeDocumentId: Id) {

    const allowOverwriteRelationsInMergeMode_ = (_: any, __: any, ___: any, ____: any) =>
        validator.assertIsAllowedRelationDomainType(_, __, ___, ____);


    if (!mergeMode) {
        await validateIsRecordedInRelation(documents, validator, mainTypeDocumentId);
        prepareIsRecordedInRelation(documents, mainTypeDocumentId);
    }
    await replaceTopLevelLiesWithins(documents, operationTypeNames, get, mainTypeDocumentId);
    await inferRecordedIns(documents, operationTypeNames, get, makeAssertNoRecordedInMismatch(mainTypeDocumentId));

    if (!mergeMode || allowOverwriteRelationsInMergeMode) {

        await validator.assertLiesWithinCorrectness(documents.map(to('resource')));
        return await completeInverseRelations(
                documents,
                get,
                getInverseRelation,
                allowOverwriteRelationsInMergeMode_,
                mergeMode);
    }
    return [];
}


async function validateIsRecordedInRelation(documentsForUpdate: Array<NewDocument>,
                                            validator: ImportValidator,
                                            mainTypeDocumentId: Id) {

    for (let document of documentsForUpdate) {
        if (!mainTypeDocumentId) {
            validator.assertHasLiesWithin(document);
        } else {
            await validator.assertIsNotOverviewType(document);
            await validator.isRecordedInTargetAllowedRelationDomainType(document, mainTypeDocumentId);
        }
    }
}


function prepareIsRecordedInRelation(documentsForUpdate: Array<NewDocument>,
                                     mainTypeDocumentId: Id) {

    if (mainTypeDocumentId) {
        for (let document of documentsForUpdate) initRecordedIn(document, mainTypeDocumentId);
    }
}


/**
 * Sets RECORDED_IN relations in documents, as inferred from LIES_WITHIN.
 * Where a document is situated at the top level, i.e. directly below an operation,
 * the LIES_WITHIN entry gets deleted.
 *
 * documents get modified in place
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
            && relations[LIES_WITHIN]
            && sameset(relations[LIES_WITHIN])(relations[RECORDED_IN])) {

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



/**
 * Replaces LIES_WITHIN entries with RECORDED_IN entries where operation type documents
 * are referenced.
 *
 * documents get modified in place
 */
async function replaceTopLevelLiesWithins(documents: Array<Document>,
                                          operationTypeNames: string[],
                                          get: Get,
                                          mainTypeDocumentId: Id) {

    const relationsForDocumentsWhereLiesWithinIsDefined: Array<Relations> = documents
        .map(to('resource.relations'))
        .filter(isDefined)
        .filter(on(LIES_WITHIN, and(isDefined, isNot(empty))));

    for (let relations of relationsForDocumentsWhereLiesWithinIsDefined) {

        let liesWithinTarget: Document|undefined = undefined;
        try { liesWithinTarget = await get(relations[LIES_WITHIN][0]) } catch {}
        if (!liesWithinTarget || !operationTypeNames.includes(liesWithinTarget.resource.type)) continue;

        if (mainTypeDocumentId) throw [E.PARENT_ASSIGNMENT_TO_OPERATIONS_NOT_ALLOWED];
        relations[RECORDED_IN] = relations[LIES_WITHIN];
        delete relations[LIES_WITHIN];
    }
}


function searchInImport(targetDocumentResourceId: Id,
                        idMap: IdMap,
                        operationTypeNames: string[]
): Either<string, Document> // recordedInResourceId|targetDocument
    |undefined {            // targetDocument not found

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
