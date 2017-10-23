import {Document} from 'idai-components-2/core';
import {Injectable} from '@angular/core';

@Injectable()
/**
 * @Daniel de Oliveira
 */
export abstract class ConflictResolver {

    abstract tryToSolveConflict(
        latestRevision: Document,
        conflictedRevision: Document,
        previousRevision: Document): any;
}