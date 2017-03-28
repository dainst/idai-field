import {RelationsStrategy} from './relations-strategy'

/**
 * @author Thomas Kleinke
 */
export class NoRelationsStrategy implements RelationsStrategy {

    public completeRelations(resourceIds: string[]): Promise<any> {

        return new Promise<any>((resolve) => { resolve(); });
    }

    public resetRelations(resourceIds: string[]): Promise<any> {

        return new Promise<any>((resolve) => { resolve(); });
    }

}