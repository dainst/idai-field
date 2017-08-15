import {Document} from 'idai-components-2/core';

/**
 * @Daniel de Oliveira
 */
export abstract class ConflictResolver {

    abstract tryToSolveConflict(
        latestRevision: Document,
        conflictedRevision: Document,
        previousRevision: Document);
}