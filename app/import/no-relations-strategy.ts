import {RelationsStrategy} from './relations-strategy'

/**
 * @author Thomas Kleinke
 */
export class NoRelationsStrategy implements RelationsStrategy {

    public completeInverseRelations(resourceIds: string[]): Promise<any> {

        return new Promise<any>((resolve) => { resolve(); });
    }

    public resetInverseRelations(resourceIds: string[]): Promise<any> {

        return new Promise<any>((resolve) => { resolve(); });
    }

}