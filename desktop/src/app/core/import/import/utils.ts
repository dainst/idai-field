import { Document, Lookup, Relations } from 'idai-field-core';
import { aMap, arrayEqual, isNot, on, to, undefinedOrEmpty, union } from 'tsfun';
import { makeLookup } from '../../../../../../core/src/tools/transformers';
import { ImportErrors as E } from './import-errors';
import { Id, Identifier } from './types';
import RECORDED_IN = Relations.Hierarchy.RECORDEDIN;


export const unionOfDocuments = (docs: Array<Array<Document>>) => union(on(['resource', 'id']), docs);


export const makeDocumentsLookup: (ds: Array<Document>) => Lookup<Document> = makeLookup(['resource', 'id']);


export function assertInSameOperationWith(document: Document) { return (targetDocument: Document) => {

    const documentRecordedIn = to(['resource','relations',RECORDED_IN], undefined)(document);
    const targetDocumentRecordedIn = to(['resource','relations',RECORDED_IN], undefined)(targetDocument);

    if (isNot(undefinedOrEmpty)(documentRecordedIn)
        && isNot(undefinedOrEmpty)(targetDocumentRecordedIn)
        && isNot(arrayEqual(targetDocumentRecordedIn))(documentRecordedIn)) {

        throw [E.MUST_BE_IN_SAME_OPERATION, document.resource.identifier, targetDocument.resource.identifier];
    }
}}



export async function iterateRelationsInImport(
    relations: Relations,
    asyncIterationFunction: (relation: string, idOrIdentifier: Id|Identifier, i: number) => Promise<void>): Promise<void> {

    for (let relation of Object.keys(relations)) {
        if (relations[relation] === null) continue;
        await aMap(
            relations[relation],
            async (idOrIdentifier, i) => {
                await asyncIterationFunction(relation, idOrIdentifier, i);
            }
        );
    }
}
