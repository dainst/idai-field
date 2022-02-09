import { Datastore, Document } from 'idai-field-core';
import { M } from '../../messages/m';


/**
 * @author Thomas Kleinke
 */
export module ConflictResolving {

    export async function getConflictedRevisions(document: Document, inspectedRevisions: Array<Document>,
                                                 datastore: Datastore): Promise<Array<Document>> {

        const conflictedRevisions: Array<Document> = [];

        for (let revisionId of (document as any)._conflicts) {
            if (inspectedRevisions.find((revision: any) => revision._rev === revisionId)) {
                continue;
            }

            try {
                conflictedRevisions.push(
                    await datastore.getRevision(document.resource.id, revisionId)
                );
            } catch (err) {
                console.error('Revision not found: ' + document.resource.id + ' ' + revisionId);
                throw [M.DATASTORE_ERROR_NOT_FOUND];
            }
        }

        return conflictedRevisions;
    }


    export function sortRevisions(revisions: Array<Document>) {

        revisions.sort((a: Document, b: Document) =>
            Document.getLastModified(a) < Document.getLastModified(b)
                ? -1
                : Document.getLastModified(a) > Document.getLastModified(b)
                    ? 1
                    : 0);
    }


    export function markRevisionAsInspected(revision: Document, conflictedRevisions: Array<Document>,
                                            inspectedRevisions: Array<Document>) {

        let index = conflictedRevisions.indexOf(revision);
        conflictedRevisions.splice(index, 1);
        inspectedRevisions.push(revision);
    }
}
