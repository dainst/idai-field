import {RollbackStrategy} from './rollback-strategy'
import {Datastore} from 'idai-components-2/datastore';

/**
 * @author Thomas Kleinke
 */
export class DefaultRollbackStrategy implements RollbackStrategy {


    constructor(private datastore: Datastore) { }


    public rollback(resourceIds: string[]): Promise<any> {

        let promises: Array<Promise<any>> = [];

        for (let resourceId of resourceIds) {
            promises.push(this.deleteResource(resourceId));
        }

        return Promise.all(promises);
    }


    private deleteResource(resourceId: string): Promise<any> {

        return new Promise<any>((resolve, reject) => {
            this.datastore.get(resourceId)
                .then(
                    document => { return this.datastore.remove(document); },
                    err => reject(err)
                ).then(
                    () => resolve(),
                    err => reject(err)
                );
        });
    }
}