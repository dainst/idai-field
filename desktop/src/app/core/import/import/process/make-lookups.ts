import {Document} from 'idai-components-2';
import {Lookup} from '../../../util/utils';
import {ResourceId} from '../../../constants';
import {makeDocumentsLookup} from '../utils';
import {compose, lookup, map, flatten, flow, isDefined, Pair, remove, subtract, union, aReduce, aMap} from 'tsfun';
import {clone} from '../../../util/object-util';
import {ImportErrors as E} from '../import-errors';


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
                    documentsById[targetId] = clone(await get(targetId));
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
        remove(compose(lookup(documentsLookup), isDefined))) as any/* TODO review any*/;
}
