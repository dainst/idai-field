import {RollbackStrategy} from './rollback-strategy'

/**
 * @author Thomas Kleinke
 */
export class NoRollbackStrategy implements RollbackStrategy {

    public rollback(resourceIds: string[]): Promise<any> {

        return new Promise<any>((resolve) => { resolve(); });
    }
}