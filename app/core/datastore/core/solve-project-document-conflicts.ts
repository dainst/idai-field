import {asyncMap} from 'tsfun-extra';
import {assoc, to, lookup, flow} from 'tsfun';
import {Document, Resource} from 'idai-components-2';
import {DatastoreUtil} from './datastore-util';
import {ResourceId, RevisionId} from '../../../c';
import {dissocIndices, replaceLast} from './helpers';
import getConflicts = DatastoreUtil.getConflicts;


/**
 * @author Daniel de Oliveira
 */
export async function solveProjectDocumentConflict(
    document:       Document,
    solveRevisions: (_: Array<Resource>) => [Resource, number[]],
    crunch:         (_: Array<Resource>) => Resource,
    fetch:          (_: ResourceId) => Promise<Document>,
    fetchRevision:  (_: ResourceId, __: RevisionId) => Promise<Document>,
    update:         (_: Document, conflicts: string[]) => Promise<Document>): Promise<Document> {

    const latestRevisionDocument = await fetch(document.resource.id);
    const insertResourceIntoLatestRevisionDocument = // this is to work with the latest changes history
        (resource: Resource) => assoc(RESOURCE, resource)(latestRevisionDocument);

    let conflicts = getConflicts(latestRevisionDocument); // fetch again, to make sure it is up to date after the timeout
    if (!conflicts) return document;                      // again, to make sure other client did not solve it in that exact instant

    const conflictedDocuments =
        await asyncMap((resourceId: string) => fetchRevision(document.resource.id, resourceId))
        (conflicts);
    const conflictedSortedDocuments = DatastoreUtil.sortRevisionsByLastModified(conflictedDocuments);
    conflicts = conflictedSortedDocuments.map(to('_rev'));

    const resourcesOfCurrentAndOldRevisionDocuments =
        conflictedSortedDocuments
            .concat(latestRevisionDocument)
            .map(to(RESOURCE));

    const result = await resolve(
        resourcesOfCurrentAndOldRevisionDocuments,
        conflicts,
        solveRevisions,
        crunch);

    return await update(insertResourceIntoLatestRevisionDocument(result[0]), result[1]);
}


async function resolve(
    resources:        Array<Resource>,
    conflicts:        RevisionId[],
    solveRevisions:   (_: Array<Resource>) => [Resource, number[]],
    crunch:           (_: Array<Resource>) => Resource): Promise<[Resource, RevisionId[]]> {

    const [resolvedResource_, indicesOfResolvedResources] = solveRevisions(resources);

    const solvedConflicts = indicesOfResolvedResources.map(lookup(conflicts)) as string[];

    const resolvedResource =
        flow(
            resources,
            dissocIndices(indicesOfResolvedResources.sort()),
            replaceLast(resolvedResource_),
            crunch) as Resource;

    return [resolvedResource, solvedConflicts];
}


const RESOURCE = 'resource';