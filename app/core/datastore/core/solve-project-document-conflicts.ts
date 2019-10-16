import {asyncMap} from 'tsfun-extra';
import {assoc, to} from 'tsfun';
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

    const conflicts = getConflicts(latestRevisionDocument); // fetch again, to make sure it is up to date after the timeout
    if (!conflicts) return document;                        // again, to make sure other client did not solve it in that exact instant

    const conflictedDocuments =
        await asyncMap((resourceId: string) => fetchRevision(document.resource.id, resourceId))
        (conflicts.sort()); // TODO should be ordered not only by revision id, but by first by revision id and then by time ascending (better because it takes differing times (not set on computer, time zones) into account)

    const resourcesOfCurrentAndOldRevisionDocuments =
        conflictedDocuments
            .concat(latestRevisionDocument)
            .map(to(RESOURCE));

    return await resolve(
        resourcesOfCurrentAndOldRevisionDocuments,
        conflicts,
        solve,
        solveAlternative,
        update,
        insertResourceIntoLatestRevisionDocument)
}


async function resolve(
    resourcesOfCurrentAndOldRevisionDocuments: Resources,
    conflicts:        string[],
    solve:            (_: Resources) => Resources,
    solveAlternative: (_: Resources) => Resource,
    update:           (_: Document, conflicts: string[]) => Promise<Document>,
    insertResourceIntoLatestRevisionDocument: (_: Resource) => Document): Promise<Document> {

    const resolvedResources = solve(resourcesOfCurrentAndOldRevisionDocuments);
    if (resolvedResources.length === 1) {

        const resolvedResource = resolvedResources[0];
        const assembledDocument = insertResourceIntoLatestRevisionDocument(resolvedResource);
        return await update(assembledDocument, conflicts);

    } else {

        // TODO
        // compare the length with the length of resourcesOfCurrentAndOldRevisionDocuments.
        // Since we fold from the right and the last resource is of the current document,
        // we know exactly which resources have been successfully auto-resolved.
        // These revisions can then be squashed during the update of the still conflicted
        // (with the remaining conflicts) document.
        //
        // TODO update the doc a first time here
        //
        // When we have a partially solved and squashed document, we can try the alternative way
        // of solving, which creates an entirely new revision with the desired properties for that alternative case.
        const resolvedResource = solveAlternative(resolvedResources);
        const assembledDocument = insertResourceIntoLatestRevisionDocument(resolvedResource);
        // TODO update again

        return assembledDocument;
    }
}


const RESOURCE = 'resource';