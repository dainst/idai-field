import { Lookup, ResourceId } from 'idai-field-core';
import { Document } from 'idai-field-core';
import { aMap, aReduce, compose, flatten, flow, isDefined, lookup, map, Pair, remove, subtract, union } from 'tsfun';
import { ImportErrors as E } from '../import-errors';
import { makeDocumentsLookup } from '../utils';


export async function makeLookups(documents: Array<Document>,
                                  get: (resourceId) => Promise<Document>,
                                  mergeMode: boolean)
    : Promise<[Lookup<Document>, Lookup<[ResourceId[], Array<Document>]>]> {

    const documentsLookup = makeDocumentsLookup(documents);

    const targetIdsLookup = await aReduce(
        getTargetIds(mergeMode, get, documentsLookup), {}, documentsLookup);
    const targetDocumentsLookup = await aReduce(
        getTargetDocuments(get), {}, targetIdsLookup);
    const targetsLookup: Lookup<[ResourceId[], Array<Document>]> = map(targetIdsLookup, (ids) => {
        return [ids[0], union(ids).map(lookup(targetDocumentsLookup))]
    });

    return [documentsLookup, targetsLookup];
}


function getTargetDocuments(get: (_: string) => Promise<Document>) {

    return async (documentsById: Lookup<Document>,
                  targetDocIdsPair: Pair<ResourceId[]>) => {

        const targetDocIds = union(targetDocIdsPair);

        await aMap(
            targetDocIds,
            async (targetId: ResourceId) => {
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

    return async (targetIdsMap: { [_: string]: [ResourceId[], ResourceId[]] },
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
                subtract<ResourceId>(targetIds)(
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
