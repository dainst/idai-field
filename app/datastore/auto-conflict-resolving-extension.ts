import {Action, Document} from 'idai-components-2/core';
import {IdaiFieldConflictResolver} from '../model/idai-field-conflict-resolver';
import {M} from '../m';
import {PouchdbDatastore} from './pouchdb-datastore';
import {Injectable} from "@angular/core";
import {ConflictResolver} from './conflict-resolver';

@Injectable()
/**
 * @author Thomas Kleinke
 */
export class AutoConflictResolvingExtension {

    public promise: Promise<any> = Promise.resolve();

    private inspectedRevisionsIds: string[] = [];
    private datastore: PouchdbDatastore;
    private conflictResolver: ConflictResolver;

    public setDatastore(datastore: PouchdbDatastore) {
        this.datastore = datastore;
    }

    public setConflictResolver(conflictResolver: ConflictResolver) {
        this.conflictResolver = conflictResolver;
    }

    public autoResolve(document: Document, userName: string): Promise<any> {
        if (!this.datastore) return Promise.reject("no datastore");
        if (!this.conflictResolver) return Promise.reject("no conflict resolver");

        this.promise = this.promise.then(() => {
            if (this.hasUnhandledConflicts(document)) {
                return this.handleConflicts(document, userName);
            } else {
                return Promise.resolve();
            }
        });

        return this.promise;
    }

    public handleConflicts(document: Document, userName: string): Promise<any> {

        return this.getConflictedRevisions(document, userName).then(conflictedRevisions => {
            let promise: Promise<any> = Promise.resolve();

            for (let conflictedRevision of conflictedRevisions) {
                promise = promise.then(() => {
                    this.inspectedRevisionsIds.push(conflictedRevision['_rev']);

                    this.getPreviousRevision(conflictedRevision).then(previousRevision => {
                        const result = this.conflictResolver.tryToSolveConflict(
                            <any> document, <any> conflictedRevision, <any> previousRevision);

                        if (result['resolvedConflicts'] > 0 || result['unresolvedConflicts'] == 0) {
                            return this.datastore.update(document).then(() => {
                                if (!result['unresolvedConflicts']) {
                                    return this.datastore.removeRevision(document.resource.id, conflictedRevision['_rev']);
                                }
                            });
                        }
                    });
                });
            }

            return promise;
        });
    }

    private getRevisionNumber(revision: Document): number {

        const revisionId = revision['_rev'];
        const index = revisionId.indexOf('-');
        const revisionNumber = revisionId.substring(0, index);

        return parseInt(revisionNumber);
    }

    private getPreviousRevision(revision: Document): Promise<Document> {

        return this.datastore.fetch(revision.resource.id, { revs_info: true })
            .then(doc => doc['_revs_info']).then(history => {

            const previousRevisionNumber: number = this.getRevisionNumber(revision) - 1;

            if (previousRevisionNumber < 1) return Promise.resolve(undefined);

            const prefix = previousRevisionNumber.toString() + '-';
            let previousRevisionId: string;

            for (let historyElement of history) {
                if (historyElement.rev.startsWith(prefix) && historyElement.status == 'available') {
                    previousRevisionId = historyElement.rev;
                    break;
                }
            }

            return this.datastore.fetch(revision.resource.id, { rev: previousRevisionId });
        });
    }

    private getConflictedRevisions(document: Document, userName: string): Promise<Array<Document>> {

        // TODO Necessary?
        if (!document['_conflicts']) return Promise.resolve([]);

        let promises: Array<Promise<Document>> = [];

        for (let revisionId of document['_conflicts']) {
            promises.push(this.datastore.fetch(document.resource.id, { rev: revisionId }));
        }

        return Promise.all(promises)
            .catch(() => Promise.reject([M.DATASTORE_NOT_FOUND]))
            .then(revisions => {
            let result: Array<Document> = [];

            for (let revision of revisions) {
                const lastAction: Action = revision.modified && revision.modified.length > 0 ?
                    revision.modified[revision.modified.length - 1] : revision.created;
                if (lastAction.user == userName) result.push(revision);
            }

            return Promise.resolve(result);
        });
    }

    private hasUnhandledConflicts(document: Document): boolean {

        if (!document['_conflicts']) return false;

        for (let revisionId of document['_conflicts']) {
            if (this.inspectedRevisionsIds.indexOf(revisionId) == -1) return true;
        }

        return false;
    }
}