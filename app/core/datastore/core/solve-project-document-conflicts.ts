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
    update:        (_: Document, conflicts: string[]) => Promise<Document|undefined>): Promise<Document|undefined> {

    const latestRevision = await fetch(document.resource.id);
    const conflicts = getConflicts(latestRevision); // fetch again, to make sure it is up to date after the timeout
    if (!conflicts) return document;                // again, to make sure other client did not solve it in that exact instant

    const conflictedDocuments =
        await asyncMap((resourceId: string) => fetchRevision(document.resource.id, resourceId))
        (conflicts);

    // TODO should be ordered by time ascending
    const currentAndOldRevisionsResources =
        conflictedDocuments
            .concat(latestRevision)
            .map(to('resource'));

    const resolvedResource = solveProjectResourceConflicts(currentAndOldRevisionsResources)[0];
    const assembledDocument = assoc('resource', resolvedResource)(latestRevision); // this is to work with the latest changes history
    return await update(assembledDocument, conflicts);
}