import {Document} from 'idai-components-2/core';

/**
 * @Daniel de Oliveira
 */
export interface ConflictResolver {

    tryToSolveConflict(
        latestRevision: Document,
        conflictedRevision: Document,
        previousRevision: Document);
}