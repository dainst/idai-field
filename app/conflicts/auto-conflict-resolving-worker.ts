import {Injectable} from '@angular/core';
import {Action, Document} from 'idai-components-2/core';
import {IdaiFieldDocument} from 'idai-components-2/idai-field-model';
import {Messages} from 'idai-components-2/messages';
import {IdaiFieldDatastore} from '../datastore/idai-field-datastore';
import {SettingsService} from '../settings/settings-service';
import {AutoConflictResolver} from './auto-conflict-resolver';
import {M} from '../m';

/**
 * @author Thomas Kleinke
 */
@Injectable()
export class AutoConflictResolvingWorker {

    public promise: Promise<any> = Promise.resolve();

    private inspectedRevisionsIds: string[] = [];
    private autoConflictResolver: AutoConflictResolver;

    constructor(private datastore: IdaiFieldDatastore,
                private messages: Messages,
                private settingsService: SettingsService) {

        this.autoConflictResolver = new AutoConflictResolver();
    }

    public initialize() {

        this.datastore.documentChangesNotifications().subscribe(document => {
            this.autoResolve(document as IdaiFieldDocument)
                .catch(err => {
                    console.error(err);
                    this.messages.add([M.DATASTORE_GENERIC_ERROR]);
                });
        });
    }

    public autoResolve(document: IdaiFieldDocument): Promise<any> {

        this.promise = this.promise.then(() => {
            if (this.hasUnhandledConflicts(document)) {
                return this.handleConflicts(document);
            } else {
                return Promise.resolve();
            }
        });

        return this.promise;
    }

    public handleConflicts(document: IdaiFieldDocument): Promise<any> {

        return this.getConflictedRevisions(document).then(conflictedRevisions => {
            let promise: Promise<any> = Promise.resolve();

            for (let conflictedRevision of conflictedRevisions) {
                promise = promise.then(() => {
                    this.inspectedRevisionsIds.push(conflictedRevision['_rev']);

                    this.getPreviousRevision(conflictedRevision).then(previousRevision => {
                        const result = this.autoConflictResolver.tryToSolveConflict(document, conflictedRevision, previousRevision);

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

    private getRevisionNumber(revision: IdaiFieldDocument): number {

        const revisionId = revision['_rev'];
        const index = revisionId.indexOf('-');
        const revisionNumber = revisionId.substring(0, index);

        return parseInt(revisionNumber);
    }

    private getPreviousRevision(revision: IdaiFieldDocument): Promise<IdaiFieldDocument> {

        return this.datastore.getRevisionHistory(revision.resource.id).then(history => {
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

            return this.datastore.getRevision(revision.resource.id, previousRevisionId);
        });
    }

    private getConflictedRevisions(document: IdaiFieldDocument): Promise<Array<IdaiFieldDocument>> {

        // TODO Necessary?
        if (!document['_conflicts']) return Promise.resolve([]);

        let promises: Array<Promise<IdaiFieldDocument>> = [];

        for (let revisionId of document['_conflicts']) {
            promises.push(this.datastore.getRevision(document.resource.id, revisionId));
        }

        return Promise.all(promises)
            .catch(() => Promise.reject([M.DATASTORE_NOT_FOUND]))
            .then(revisions => {
            let result: Array<IdaiFieldDocument> = [];

            for (let revision of revisions) {
                const lastAction: Action = revision.modified && revision.modified.length > 0 ?
                    revision.modified[revision.modified.length - 1] : revision.created;
                if (lastAction.user == this.settingsService.getUsername()) result.push(revision);
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