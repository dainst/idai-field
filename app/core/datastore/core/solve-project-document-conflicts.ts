import {asyncMap} from 'tsfun-extra';
import {assoc, to} from 'tsfun';
import {Resources, solveProjectResourceConflicts} from './solve-project-resource-conflicts';
import {Document} from 'idai-components-2';
import {DatastoreUtil} from './datastore-util';
import getConflicts = DatastoreUtil.getConflicts;
import {ResourceId, RevisionId} from '../../../c';


/**
 * @author Daniel de Oliveira
 */
export async function solveProjectDocumentConflict(
    document:      Document,
    solve:         (_: Resources) => Resources,
    fetch:         (_: ResourceId) => Promise<Document>,
    fetchRevision: (_: ResourceId, __: RevisionId) => Promise<Document>,
    update:        (_: Document, conflicts: string[]) => Promise<Document>): Promise<Document> {

    const latestRevisionDocument = await fetch(document.resource.id);
    const conflicts = getConflicts(latestRevisionDocument); // fetch again, to make sure it is up to date after the timeout
    if (!conflicts) return document;                        // again, to make sure other client did not solve it in that exact instant

    const conflictedDocuments =
        await asyncMap((resourceId: string) => fetchRevision(document.resource.id, resourceId))
        (conflicts);

    // TODO should be ordered by time ascending, or by revision id and then by time ascending (better because it takes differing times (not set on computer, time zones) into account)
    const resourcesOfCurrentAndOldRevisionDocuments =
        conflictedDocuments
            .concat(latestRevisionDocument)
            .map(to(RESOURCE));

    const resolvedResources = solveProjectResourceConflicts(resourcesOfCurrentAndOldRevisionDocuments);
    if (resolvedResources.length !== 1) {
        return document;
        // If the length of resolved resources is not 1, instead of resolving no conflict at all,
        // compare the length with the length of resourcesOfCurrentAndOldRevisionDocuments.
        // Since we fold from the right and the last resource is of the current document,
        // we know exactly which resources have been successfully auto-resolved.
        // These revisions can then be squashed during the update of the still conflicted
        // (with the remaining conflicts) document.
    }
    const assembledDocument = assoc(RESOURCE, resolvedResources[0])(latestRevisionDocument); // this is to work with the latest changes history
    return await update(assembledDocument, conflicts);
}


const RESOURCE = 'resource';