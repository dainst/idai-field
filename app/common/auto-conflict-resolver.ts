import {Injectable} from '@angular/core';
import {Action, Document} from 'idai-components-2/core';
import {IdaiFieldDocument} from 'idai-components-2/idai-field-model';
import {Messages} from 'idai-components-2/messages';
import {IdaiFieldDatastore} from '../datastore/idai-field-datastore';
import {SettingsService} from '../settings/settings-service';
import {DiffUtility} from '../util/diff-utility';

/**
 * @author Thomas Kleinke
 */
@Injectable()
export class AutoConflictResolver {

    public promise: Promise<any> = Promise.resolve();
    private inspectedRevisionsIds: string[] = [];

    constructor(private datastore: IdaiFieldDatastore,
                private messages: Messages,
                private settingsService: SettingsService) {
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
                promise = promise.then(() => this.tryToSolveConflict(document, revision));
            }

            return promise;
        });
    }

    private getConflictedRevisions(document: IdaiFieldDocument): Promise<Array<IdaiFieldDocument>> {

        if (!document['_conflicts']) return Promise.resolve([]);

        let promises: Array<Promise<IdaiFieldDocument>> = [];

        for (let revisionId of document['_conflicts']) {
            promises.push(this.datastore.getRevision(document.resource.id, revisionId));
        }

        return Promise.all(promises).then(revisions => {
            let result: Array<IdaiFieldDocument> = [];

            for (let revision of revisions) {
                const lastAction: Action = revision.modified && revision.modified.length > 0 ?
                    revision.modified[revision.modified.length - 1] : revision.created;
                if (lastAction.user == this.settingsService.getUsername()) result.push(revision);
            }

            return Promise.resolve(result);
        });
    }

    private tryToSolveConflict(latestRevision: IdaiFieldDocument, conflictedRevision: IdaiFieldDocument): Promise<any> {

        return this.getPreviousRevision(conflictedRevision).then(previousRevision => {

            if (!previousRevision) previousRevision = { resource: { relations: {} } } as IdaiFieldDocument;

            let resolvedFieldConflicts: number = 0;
            let unresolvedFieldConflicts: number = 0;

            const differingFieldsNames: string[]
                = DiffUtility.findDifferingFields(latestRevision.resource, conflictedRevision.resource);

            for (let fieldName of differingFieldsNames) {
                let winningRevision = this.determineWinningRevisionForField(latestRevision, conflictedRevision,
                    previousRevision, fieldName);
                if (winningRevision) {
                    if (winningRevision.resource[fieldName]) {
                        latestRevision.resource[fieldName] = winningRevision.resource[fieldName];
                    } else {
                        delete latestRevision.resource[fieldName];
                    }
                    if (winningRevision == conflictedRevision) resolvedFieldConflicts++;
                } else {
                    unresolvedFieldConflicts++;
                }
            }

            const differingRelationsNames: string[]
                = DiffUtility.findDifferingRelations(latestRevision.resource, conflictedRevision.resource);

            for (let relationName of differingRelationsNames) {
                let winningRevision = this.determineWinningRevisionForRelation(latestRevision, conflictedRevision,
                    previousRevision, relationName);
                if (winningRevision) {
                    if (winningRevision.resource.relations[relationName]) {
                        latestRevision.resource.relations[relationName]
                            = winningRevision.resource.relations[relationName];
                    } else {
                        delete latestRevision.resource.relations[relationName];
                    }
                    if (winningRevision == conflictedRevision) resolvedFieldConflicts++;
                } else {
                    unresolvedFieldConflicts++;
                }
            }

            this.inspectedRevisionsIds.push(conflictedRevision['_rev']);

            if (resolvedFieldConflicts > 0 || unresolvedFieldConflicts == 0) {
                return this.datastore.update(latestRevision).then(() => {
                    if (!unresolvedFieldConflicts) {
                        return this.datastore.removeRevision(latestRevision.resource.id, conflictedRevision['_rev']);
                    } else {
                        return Promise.resolve();
                    }
                });
            } else {
                return Promise.resolve();
            }
        });
    }

    private determineWinningRevisionForField(latestRevision: IdaiFieldDocument, conflictedRevision: IdaiFieldDocument,
                                     previousRevision: IdaiFieldDocument, fieldName: string): IdaiFieldDocument {

        if (fieldName == 'geometry' || fieldName == 'georeference') {
            if (latestRevision.resource[fieldName] && previousRevision.resource[fieldName]
                    && !conflictedRevision.resource[fieldName]) {
                return conflictedRevision;
            }

            if (!latestRevision.resource[fieldName] && !previousRevision.resource[fieldName]
                    && conflictedRevision.resource[fieldName]) {
                return conflictedRevision;
            }

            if (conflictedRevision.resource[fieldName] && previousRevision.resource[fieldName]
                    && !latestRevision.resource[fieldName]) {
                return latestRevision;
            }

            if (!conflictedRevision.resource[fieldName] && !previousRevision.resource[fieldName]
                    && latestRevision.resource[fieldName]) {
                return latestRevision;
            }
        }

        if (DiffUtility.compareFields(latestRevision.resource[fieldName], previousRevision.resource[fieldName])) {
            return conflictedRevision;
        }

        if (DiffUtility.compareFields(conflictedRevision.resource[fieldName], previousRevision.resource[fieldName])) {
            return latestRevision;
        }

        return undefined;
    }

    private determineWinningRevisionForRelation(latestRevision: IdaiFieldDocument,
                                                conflictedRevision: IdaiFieldDocument,
                                                previousRevision: IdaiFieldDocument,
                                                relationName: string): IdaiFieldDocument {

        if (DiffUtility.compareFields(latestRevision.resource.relations[relationName],
                previousRevision.resource.relations[relationName])) {
            return conflictedRevision;
        }

        if (DiffUtility.compareFields(conflictedRevision.resource.relations[relationName],
                previousRevision.resource.relations[relationName])) {
            return latestRevision;
        }
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

    private getRevisionNumber(revision: IdaiFieldDocument): number {

        const revisionId = revision['_rev'];
        const index = revisionId.indexOf('-');
        const revisionNumber = revisionId.substring(0, index);

        return parseInt(revisionNumber);
    }

    private hasUnhandledConflicts(document: Document): boolean {

        if (!document['_conflicts']) return false;

        for (let revisionId of document['_conflicts']) {
            if (this.inspectedRevisionsIds.indexOf(revisionId) == -1) return true;
        }

        return false;
    }
}