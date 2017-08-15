import {IdaiFieldDocument} from 'idai-components-2/idai-field-model';
import {IdaiFieldDiffUtility} from './idai-field-diff-utility';
import {ObjectUtil} from '../util/object-util';

export class IdaiFieldConflictResolver {

    constructor() {}

    // TODO clone latestRevision and return
    public tryToSolveConflict(latestRevision: IdaiFieldDocument, conflictedRevision: IdaiFieldDocument,
                              previousRevision: IdaiFieldDocument) {

        if (!previousRevision) previousRevision = { resource: { relations: {} } } as IdaiFieldDocument;

        const fieldConflictsResult = this.resolveFieldConflicts(latestRevision, conflictedRevision,
            previousRevision);
        const relationConflictsResult = this.resolveRelationConflicts(latestRevision, conflictedRevision,
            previousRevision);

        const resolvedConflicts: number
            = fieldConflictsResult.resolvedConflicts + relationConflictsResult.resolvedConflicts;
        const unresolvedConflicts: number
            = fieldConflictsResult.unresolvedConflicts + relationConflictsResult.unresolvedConflicts;

        return {
            resolvedConflicts: resolvedConflicts,
            unresolvedConflicts: unresolvedConflicts
        }
    }

    private resolveFieldConflicts(latestRevision: IdaiFieldDocument, conflictedRevision: IdaiFieldDocument,
                                  previousRevision: IdaiFieldDocument): any {

        let result = {
            resolvedConflicts: 0,
            unresolvedConflicts: 0
        };

        const differingFieldsNames: string[]
            = IdaiFieldDiffUtility.findDifferingFields(latestRevision.resource, conflictedRevision.resource);

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
            = IdaiFieldDiffUtility.findDifferingRelations(latestRevision.resource, conflictedRevision.resource);

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

        if (ObjectUtil.compareFields(latestRevision.resource[fieldName], previousRevision.resource[fieldName])) {
            return conflictedRevision;
        }

        if (ObjectUtil.compareFields(conflictedRevision.resource[fieldName], previousRevision.resource[fieldName])) {
            return latestRevision;
        }

        return undefined;
    }

    private determineWinningRevisionForRelation(latestRevision: IdaiFieldDocument,
                                                conflictedRevision: IdaiFieldDocument,
                                                previousRevision: IdaiFieldDocument,
                                                relationName: string): IdaiFieldDocument {

        if (ObjectUtil.compareFields(latestRevision.resource.relations[relationName],
                previousRevision.resource.relations[relationName])) {
            return conflictedRevision;
        }

        if (ObjectUtil.compareFields(conflictedRevision.resource.relations[relationName],
                previousRevision.resource.relations[relationName])) {
            return latestRevision;
        }
    }


}