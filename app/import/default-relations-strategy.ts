import {RelationsCompleter} from './relations-completer';
import {RelationsStrategy} from './relations-strategy';

/**
 *@author Thomas Kleinke
 */
export class DefaultRelationsStrategy implements RelationsStrategy {

    constructor(private relationsCompleter: RelationsCompleter) { }

    completeInverseRelations(resourceIds: string[]): Promise<any> {
        return this.relationsCompleter.completeInverseRelations(resourceIds);
    }

    resetInverseRelations(resourceIds: string[]): Promise<any> {
        return this.relationsCompleter.resetInverseRelations(resourceIds);
    }
}