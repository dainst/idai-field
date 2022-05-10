import { aMap, same, on, isUndefinedOrEmpty, union } from 'tsfun';
import { Document, Lookup, Relation, Resource } from 'idai-field-core';
import { makeLookup } from '../../../../../../core/src/tools/transformers';
import { ImportErrors as E } from './import-errors';
import { Id, Identifier } from './types';
import RECORDED_IN = Relation.Hierarchy.RECORDEDIN;


export const unionOfDocuments = (docs: Array<Array<Document>>) => union(on(['resource', 'id']), docs);


export const makeDocumentsLookup: (ds: Array<Document>) => Lookup<Document> = makeLookup(['resource', 'id']);


export function assertInSameOperationWith(document: Document) { return (targetDocument: Document) => {

    const documentRecordedIn = document.resource.relations[RECORDED_IN]
    const targetDocumentRecordedIn = targetDocument.resource.relations[RECORDED_IN]

    if (!isUndefinedOrEmpty(documentRecordedIn)
        && !isUndefinedOrEmpty(targetDocumentRecordedIn)
        && !same(targetDocumentRecordedIn, documentRecordedIn)) {

        throw [E.MUST_BE_IN_SAME_OPERATION, document.resource.identifier, targetDocument.resource.identifier];
    }
}}



export async function iterateRelationsInImport(
    relations: Resource.Relations,
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
