import {IdaiFieldObject} from "../model/idai-field-object";
import {Observable} from "rxjs/Observable.d";

/**
 * This interface provides read access methods to a datastore
 * maintaining IdaiFieldObjects.
 *
 * Implementations guarantee that any of methods declared here
 * have no effect on any of the objects within the datastore.
 */
export abstract class ReadDatastore  {

    abstract get(id: string): Promise<IdaiFieldObject>;

    abstract find(query: string, options: any): Promise<IdaiFieldObject[]>;

    abstract all(options: any): Promise<IdaiFieldObject[]>;

    abstract getUnsyncedObjects(): Observable<IdaiFieldObject>;
}