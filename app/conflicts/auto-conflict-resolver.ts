import {IdaiFieldDocument} from 'idai-components-2/idai-field-model';
import {IdaiFieldDatastore} from '../datastore/idai-field-datastore';
import {DiffUtility} from './diff-utility';
import {Util} from '../util/util';

export class AutoConflictResolver {

    constructor(private datastore: IdaiFieldDatastore) {}

    public tryToSolveConflict(latestRevision: IdaiFieldDocument, conflictedRevision: IdaiFieldDocument): Promise<any> {

        return this.getPreviousRevision(conflictedRevision).then(previousRevision => {

            if (!previousRevision) previousRevision = { resource: { relations: {} } } as IdaiFieldDocument;

            const fieldConflictsResult = this.resolveFieldConflicts(latestRevision, conflictedRevision,
                previousRevision);
            const relationConflictsResult = this.resolveRelationConflicts(latestRevision, conflictedRevision,
                previousRevision);

            const resolvedConflicts: number
                = fieldConflictsResult.resolvedConflicts + relationConflictsResult.resolvedConflicts;
            const unresolvedConflicts: number
                = fieldConflictsResult.unresolvedConflicts + relationConflictsResult.unresolvedConflicts;

            if (resolvedConflicts > 0 || unresolvedConflicts == 0) {
                return this.datastore.update(latestRevision).then(() => {
                    if (!unresolvedConflicts) {
                        return this.datastore.removeRevision(latestRevision.resource.id, conflictedRevision['_rev']);
                    }
                });
            }
        });
    }

    private resolveFieldConflicts(latestRevision: IdaiFieldDocument, conflictedRevision: IdaiFieldDocument,
                                  previousRevision: IdaiFieldDocument): any {

        let result = {
            resolvedConflicts: 0,
            unresolvedConflicts: 0
        };

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
                if (winningRevision == conflictedRevision) result.resolvedConflicts++;
            } else {
                result.unresolvedConflicts++;
            }
        }

        return result;
    }

    private resolveRelationConflicts(latestRevision: IdaiFieldDocument, conflictedRevision: IdaiFieldDocument,
                                     previousRevision: IdaiFieldDocument): any {

        let result = {
            resolvedConflicts: 0,
            unresolvedConflicts: 0
        };

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
                if (winningRevision == conflictedRevision) result.resolvedConflicts++;
            } else {
                result.unresolvedConflicts++;
            }
        }

        return result;
    }

    private determineWinningRevisionForField(latestRevision: IdaiFieldDocument, conflictedRevision: IdaiFieldDocument,
                                             previousRevision: IdaiFieldDocument,
                                             fieldName: string): IdaiFieldDocument {

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

        if (Util.compareFields(latestRevision.resource[fieldName], previousRevision.resource[fieldName])) {
            return conflictedRevision;
        }

        if (Util.compareFields(conflictedRevision.resource[fieldName], previousRevision.resource[fieldName])) {
            return latestRevision;
        }

        return undefined;
    }

    private determineWinningRevisionForRelation(latestRevision: IdaiFieldDocument,
                                                conflictedRevision: IdaiFieldDocument,
                                                previousRevision: IdaiFieldDocument,
                                                relationName: string): IdaiFieldDocument {

        if (Util.compareFields(latestRevision.resource.relations[relationName],
                previousRevision.resource.relations[relationName])) {
            return conflictedRevision;
        }

        if (Util.compareFields(conflictedRevision.resource.relations[relationName],
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
}