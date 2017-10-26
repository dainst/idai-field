import {Injectable} from '@angular/core';
import {IdaiFieldDocument} from 'idai-components-2/idai-field-model';
import {IdaiFieldDiffUtility} from './idai-field-diff-utility';
import {ObjectUtil} from '../../util/object-util';
import {ConflictResolver} from '../datastore/core/conflict-resolver';

@Injectable()
/**
 * @author Thomas Kleinke
 * @author Daniel de Oliveira
 */
export class IdaiFieldConflictResolver extends ConflictResolver {

    /**
     * @param latestRevision
     * @param conflictedRevision
     * @param previousRevision
     * @returns {any} a new document, based on latestRevision, with fields that have
     *   been subject to automatic conflict resolution updated accordingly,
     *   if and only if there are no unresolved conflicts,
     *   undefined otherwise.
     */
    public tryToSolveConflict(latestRevision: IdaiFieldDocument, conflictedRevision: IdaiFieldDocument,
                              previousRevision: IdaiFieldDocument): any {

        const updatedLatestRevision = JSON.parse(JSON.stringify(latestRevision));

        if (!previousRevision) previousRevision = { resource: { relations: {} } } as IdaiFieldDocument;

        const unresolvedFieldconflicts = IdaiFieldConflictResolver.resolveFieldConflicts(updatedLatestRevision, conflictedRevision,
            previousRevision);
        const hasRelationConflicts = IdaiFieldConflictResolver.hasRelationConflicts(updatedLatestRevision, conflictedRevision);

        if (unresolvedFieldconflicts == 0
            && !hasRelationConflicts) return updatedLatestRevision;
    }


    private static resolveFieldConflicts(latestRevision: IdaiFieldDocument, conflictedRevision: IdaiFieldDocument,
                                  previousRevision: IdaiFieldDocument): number {

        let unresolvedConflicts = 0;

        const differingFieldsNames: string[]
            = IdaiFieldDiffUtility.findDifferingFields(latestRevision.resource, conflictedRevision.resource);

        for (let fieldName of differingFieldsNames) {
            let winningRevision = IdaiFieldConflictResolver.determineWinningRevisionForField(latestRevision, conflictedRevision,
                previousRevision, fieldName);
            if (winningRevision) {
                if (winningRevision.resource[fieldName]) {
                    latestRevision.resource[fieldName] = winningRevision.resource[fieldName];
                } else {
                    delete latestRevision.resource[fieldName];
                }
            } else {
                unresolvedConflicts++;
            }
        }

        return unresolvedConflicts;
    }


    private static hasRelationConflicts(latestRevision: IdaiFieldDocument, conflictedRevision: IdaiFieldDocument): boolean {

        return (IdaiFieldDiffUtility.findDifferingRelations
                (latestRevision.resource, conflictedRevision.resource).length > 0);
    }


    private static determineWinningRevisionForField(latestRevision: IdaiFieldDocument, conflictedRevision: IdaiFieldDocument,
                                             previousRevision: IdaiFieldDocument,
                                             fieldName: string): IdaiFieldDocument|undefined {

        if (ObjectUtil.compare(latestRevision.resource[fieldName], previousRevision.resource[fieldName])) {
            return conflictedRevision;
        }

        if (ObjectUtil.compare(conflictedRevision.resource[fieldName], previousRevision.resource[fieldName])) {
            return latestRevision;
        }

        return undefined;
    }
}