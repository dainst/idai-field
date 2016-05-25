import {Entity} from "../core-services/entity";
import {Observable} from "rxjs/Observable";

/**
 * This interface provides read access methods to a datastore
 * maintaining IdaiFieldObjects.
 *
 * Implementations guarantee that any of methods declared here
 * have no effect on any of the objects within the datastore.
 */
export abstract class ReadDatastore  {

    abstract get(id: string): Promise<Entity>;

    abstract find(query: string, options: any): Promise<Entity[]>;

    abstract all(options: any): Promise<Entity[]>;

    abstract getUnsyncedObjects(): Observable<Entity>;
}