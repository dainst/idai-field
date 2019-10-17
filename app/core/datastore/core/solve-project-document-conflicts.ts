import {asyncMap} from 'tsfun-extra';
import {assoc, to, takeRight} from 'tsfun';
import {Resources} from './project-resource-conflict-resolution';
import {Document, Resource} from 'idai-components-2';
import {DatastoreUtil} from './datastore-util';
import getConflicts = DatastoreUtil.getConflicts;
import {ResourceId, RevisionId} from '../../../c';


/**
 * @author Daniel de Oliveira
 */
export async function solveProjectDocumentConflict(
    document:         Document,
    solve:            (_: Resources) => Resources,
    solveAlternative: (_: Resources) => Resource,
    fetch:            (_: ResourceId) => Promise<Document>,
    fetchRevision:    (_: ResourceId, __: RevisionId) => Promise<Document>,
    update:           (_: Document, conflicts: string[]) => Promise<Document>): Promise<Document> {

    const latestRevisionDocument = await fetch(document.resource.id);
    const insertResourceIntoLatestRevisionDocument = // this is to work with the latest changes history
        (resource: Resource) => assoc(RESOURCE, resource)(latestRevisionDocument);

    let conflicts = getConflicts(latestRevisionDocument); // fetch again, to make sure it is up to date after the timeout
    if (!conflicts) return document;                        // again, to make sure other client did not solve it in that exact instant

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
        solve,
        solveAlternative);

    return await update(insertResourceIntoLatestRevisionDocument(result[0]), result[1]);
}


async function resolve(
    resourcesOfCurrentAndOldRevisionDocuments: Resources,
    conflicts:        string[],
    solve:            (_: Resources) => Resources,
    solveAlternative: (_: Resources) => Resource): Promise<[Resource, RevisionId[]]> {

    const resolvedResources = solve(resourcesOfCurrentAndOldRevisionDocuments);

    let solvedConflicts: RevisionId[] = [];
    let resolvedResource: Resource|undefined = undefined;
    if (resolvedResources.length === 1) {
        solvedConflicts = conflicts;
        resolvedResource = resolvedResources[0];
    } else {
        const numResolvedResources = conflicts.length - (resolvedResources.length - 1);
        solvedConflicts = takeRight(numResolvedResources)(conflicts) as string[];
        resolvedResource = solveAlternative(resolvedResources);
    }
    return [resolvedResource, solvedConflicts];
}


const RESOURCE = 'resource';