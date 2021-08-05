import { Lookup, Resource } from 'idai-field-core';
import { Document } from 'idai-field-core';
import { aMap, aReduce, compose, flatten, flow, isDefined, lookup, map, Pair, remove, subtract, union } from 'tsfun';
import { ImportErrors as E } from '../import-errors';
import { makeDocumentsLookup } from '../utils';


export async function makeLookups(documents: Array<Document>,
                                  get: (resourceId) => Promise<Document>,
                                  mergeMode: boolean)
    : Promise<[Lookup<Document>, Lookup<[Array<Resource.Id>, Array<Document>]>]> {

    const documentsLookup = makeDocumentsLookup(documents);

    const targetIdsLookup = await aReduce(
        getTargetIds(mergeMode, get, documentsLookup), {}, documentsLookup);
    const targetDocumentsLookup = await aReduce(
        getTargetDocuments(get), {}, targetIdsLookup);
    const targetsLookup: Lookup<[Array<Resource.Id>, Array<Document>]> = map(targetIdsLookup, (ids) => {
        return [ids[0], union(ids).map(lookup(targetDocumentsLookup))]
    });

    return [documentsLookup, targetsLookup];
}


function getTargetDocuments(get: (_: string) => Promise<Document>) {

    return async (documentsById: Lookup<Document>,
                  targetDocIdsPair: Pair<Array<Resource.Id>>) => {

        const targetDocIds = union(targetDocIdsPair);

        await aMap(
            targetDocIds,
            async (targetId: Resource.Id) => {
                if (!documentsById[targetId]) try {
                    documentsById[targetId] = Document.clone(await get(targetId));
                } catch {
                    throw [E.MISSING_RELATION_TARGET, targetId];
                }
            });
        return documentsById;
    }
}


function getTargetIds(mergeMode: boolean,
                      get: (_: string) => Promise<Document>,
                      documentsById: Lookup<Document>) {

    return async (targetIdsMap: { [_: string]: [Array<Resource.Id>, Array<Resource.Id>] },
                  document: Document) => {

        let targetIds = targetIdsReferingToDbResources(document, documentsById);
        if (mergeMode) {
            let oldVersion;
            try {
                oldVersion = await get(document.resource.id);
            } catch {
                throw 'FATAL: Existing version of document not found';
            }
            targetIdsMap[document.resource.id] = [
                targetIds,
                subtract<Resource.Id>(targetIds)(
                    targetIdsReferingToDbResources(oldVersion, documentsById)
                )
            ];
        } else {
            targetIdsMap[document.resource.id] =  [targetIds, []];
        }

        return targetIdsMap;
    }
}


function targetIdsReferingToDbResources(document: Document, documentsLookup: Lookup<Document>) {

    return flow(
        document.resource.relations,
        Object.values,
        flatten(),
        remove(compose(lookup(documentsLookup), isDefined))) as any;
}
