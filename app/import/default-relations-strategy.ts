import {RelationsCompleter} from './relations-completer';
import {RelationsStrategy} from './relations-strategy';

/**
 *@author Thomas Kleinke
 */
export class DefaultRelationsStrategy implements RelationsStrategy {

    constructor(private relationsCompleter: RelationsCompleter) { }

    completeRelations(resourceIds: string[]): Promise<any> {
        return this.relationsCompleter.completeRelations(resourceIds);
    }

    resetRelations(resourceIds: string[]): Promise<any> {
        return this.relationsCompleter.resetRelations(resourceIds);
    }
}