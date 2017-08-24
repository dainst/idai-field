import {Injectable} from '@angular/core';
import {Action, Document} from 'idai-components-2/core';
import {PouchdbDatastore} from './pouchdb-datastore';
import {ConflictResolver} from './conflict-resolver';
import {RevisionHelper} from './revision-helper';
import {ChangeHistoryUtil} from '../model/change-history-util';
import {M} from '../m';
import {PouchdbProxy} from './pouchdb-proxy';

@Injectable()
/**
 * @author Thomas Kleinke
 * @author Daniel de Oliveira
 */
export class ConflictResolvingExtension {

    public promise: Promise<any> = Promise.resolve();

    private inspectedRevisionsIds: string[] = [];
    private datastore: PouchdbDatastore;
    private db: PouchdbProxy;
    private conflictResolver: ConflictResolver;

    public setDatastore(datastore: PouchdbDatastore) {

        this.datastore = datastore;
    }

    public setDb(db: PouchdbProxy) {

        this.db = db;
    }

    public setConflictResolver(conflictResolver: ConflictResolver) {

        this.conflictResolver = conflictResolver;
    }

    public autoResolve(document: Document, userName: string): Promise<any> {
        
        if (!this.datastore) return Promise.reject('no datastore');
        if (!this.db) return Promise.reject('no db');
        if (!this.conflictResolver) return Promise.reject('no conflict resolver');

        if (ConflictResolvingExtension.hasUnhandledConflicts(this.inspectedRevisionsIds, document)) {
            return this.fetchHistory(document.resource.id).then(history =>
                this.handleConflicts(document, userName, history));
        } else {
            return Promise.resolve(undefined);
        }
    }

    private handleConflicts(document: Document, userName: string, history): Promise<any> {

        return this.getConflictedRevisionsForUser(document, userName).then(conflictedRevisions => {
            let promise: Promise<any> = Promise.resolve();
            for (let conflictedRevision of conflictedRevisions) {
                promise = promise.then(() => this.handleConflict(document, conflictedRevision, history));
            }
            return promise;
        });
    }

    private handleConflict(document: Document, conflictedRevision: Document, history): Promise<any> {

        this.inspectedRevisionsIds.push(conflictedRevision['_rev']);

        return this.datastore.fetchRevision(conflictedRevision.resource.id,
                    RevisionHelper.getPreviousRevisionId(history, conflictedRevision))
            .then(previousRevision =>
                this.solveConflict(document, conflictedRevision, previousRevision)
            );
    }

    private solveConflict(document: Document, conflictedRevision: Document, previousRevision: Document) {

        const updatedDocument = this.conflictResolver.tryToSolveConflict(
            document, conflictedRevision, previousRevision);

        if (updatedDocument) {
            ChangeHistoryUtil.mergeChangeHistories(document, conflictedRevision);

            return this.db.put(updatedDocument, { force: true }).then(() => {
                if (!updatedDocument['unresolvedConflicts']) {
                    return this.datastore.removeRevision(document.resource.id, conflictedRevision['_rev']);
                }
            });
        }
    }

    private getConflictedRevisionsForUser(document: Document, userName: string): Promise<Array<Document>> {

        let promises: Array<Promise<Document>> = [];

        for (let revisionId of document['_conflicts']) {
            promises.push(this.datastore.fetchRevision(document.resource.id, revisionId));
        }

        return Promise.all(promises)
            .catch(() => Promise.reject([M.DATASTORE_NOT_FOUND]))
            .then(revisions => ConflictResolvingExtension.getOnlyUserRevisions(revisions, userName));
    }

    private fetchHistory(resourceId: string) {

        return this.datastore.fetch(resourceId, { revs_info: true })
            .then(doc => doc['_revs_info']);
    }

    /**
     * @param revisionsDocuments
     * @param userName
     * @returns {Array<Document>} the conflicted revisions to
     *   actually to be resolved within this client. These are the ones having the
     *   clients current userName as the name of the lastAction of the revision.
     *   TODO unit test that if this is not the case the revision gets not handled
     */
    private static getOnlyUserRevisions(revisionsDocuments: Array<Document>, userName: string) {

        const result: Array<Document> = [];

        for (let revisionDocument of revisionsDocuments) {
            const lastAction: Action = revisionDocument.modified && revisionDocument.modified.length > 0 ?
                revisionDocument.modified[revisionDocument.modified.length - 1] : revisionDocument.created;
            if (lastAction.user == userName) result.push(revisionDocument);
        }

        return result;
    }

    private static hasUnhandledConflicts(inspectedRevisionsIds: string[], document: Document): boolean {

        if (!document['_conflicts']) return false;

        for (let revisionId of document['_conflicts']) {
            if (inspectedRevisionsIds.indexOf(revisionId) == -1) return true;
        }

        return false;
    }
}