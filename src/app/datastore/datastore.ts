import {IdaiFieldObject} from "../model/idai-field-object";
import {Observable} from "../../../node_modules/rxjs/Observable.d";

export abstract class Datastore {

    abstract create(object: IdaiFieldObject): Promise<string>;

    abstract update(object: IdaiFieldObject): Promise<any>;

    abstract get(id: string): Promise<IdaiFieldObject>;

    abstract delete(id: string): Promise<any>;

    abstract clear(): Promise<any>;

    abstract find(query: string, options: any): Promise<IdaiFieldObject[]>;

    abstract all(options: any): Promise<IdaiFieldObject[]>;

    abstract getUnsyncedObjects(): Observable<IdaiFieldObject>;

    abstract refresh(id:string):Promise<IdaiFieldObject>;
}