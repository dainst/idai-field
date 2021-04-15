import {Document} from 'idai-field-core';
import {Get, Id, IdMap} from '../types';
import {Either, isNot, isUndefinedOrEmpty, sameset, undefinedOrEmpty} from 'tsfun';
import {Relations} from 'idai-field-core';
import LIESWITHIN = Relations.Hierarchy.LIESWITHIN;
import RECORDEDIN = Relations.Hierarchy.RECORDEDIN;

/**
 * Sets RECORDED_IN relations in documents, as inferred from LIES_WITHIN.
 * Where a document is situated at the top level, i.e. directly below an operation,
 * the LIES_WITHIN entry gets deleted.
 *
 * documents get modified in place
 */
export async function inferRecordedIns(documents: Array<Document>,
                                       operationCategoryNames: string[],
                                       get: Get,
                                       assertNoRecordedInMismatch:
                                           (document: Document,
                                            inferredRecordedIn: string|undefined) => void) {

    const idMap = documents.reduce((tmpMap, document: Document) => {
            tmpMap[document.resource.id] = document;
            return tmpMap;
        },
        {} as IdMap);


    async function getRecordedInFromImportDocument(liesWithinTargetInImport: any) {
        if (liesWithinTargetInImport[0]) return liesWithinTargetInImport[0];

        const target = liesWithinTargetInImport[1] as Document;
        if (isNot(undefinedOrEmpty)((target.resource.relations[LIESWITHIN]))) return determineRecordedInValueFor(target);
    }


    async function getRecordedInFromExistingDocument(targetId: Id) {

        try {
            const got = await get(targetId);
            return  operationCategoryNames.includes(got.resource.category)
                ? got.resource.id
                : got.resource.relations[RECORDEDIN][0];
        } catch { console.log('FATAL: Not found'); } // should have been caught earlier, in process()
    }


    async function determineRecordedInValueFor(document: Document): Promise<string|undefined> {

        const relations = document.resource.relations;
        if (!relations || isUndefinedOrEmpty(relations[LIESWITHIN])) return;

        const liesWithinTargetInImport = searchInImport(relations[LIESWITHIN][0], idMap, operationCategoryNames);
        return liesWithinTargetInImport
            ? getRecordedInFromImportDocument(liesWithinTargetInImport)
            : getRecordedInFromExistingDocument(relations[LIESWITHIN][0]);
    }


    for (let document of documents) {

        const inferredRecordedIn = await determineRecordedInValueFor(document);
        assertNoRecordedInMismatch(document, inferredRecordedIn);

        const relations = document.resource.relations;
        if (inferredRecordedIn) relations[RECORDEDIN] = [inferredRecordedIn];
        if (relations
            && relations[LIESWITHIN]
            && relations[RECORDEDIN]
            && sameset(relations[LIESWITHIN])(relations[RECORDEDIN])) {

            delete relations[LIESWITHIN];
        }
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
