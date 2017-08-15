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

        this.autoConflictResolver = new AutoConflictResolver(datastore);
    }

    public initialize() {

        this.datastore.documentChangesNotifications().subscribe(document => {
            this.autoResolve(document as IdaiFieldDocument)
                .catch(msgWithParams => this.messages.add(msgWithParams));
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

        return this.getConflictedRevisions(document).then(revisions => {
            let promise: Promise<any> = Promise.resolve();

            for (let revision of revisions) {
                promise = promise.then(() => {
                    this.inspectedRevisionsIds.push(revision['_rev']);
                    this.autoConflictResolver.tryToSolveConflict(document, revision);
                });
            }

            return promise;
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