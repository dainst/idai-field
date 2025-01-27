import { aMap, on, union } from 'tsfun';
import { Document, Lookup, Resource } from 'idai-field-core';
import { makeLookup } from '../../../../../../core/src/tools/transformers';
import { Id, Identifier } from './types';


export const unionOfDocuments = (docs: Array<Array<Document>>) => union(on(['resource', 'id']), docs);

export const makeDocumentsLookup: (ds: Array<Document>) => Lookup<Document> = makeLookup(['resource', 'id']);


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
