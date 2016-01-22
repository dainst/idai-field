import {IdaiFieldObject} from "../model/idai-field-object";
import {IdaiObserver} from "../idai-observer";
import {IdaiObservable} from "../idai-observable";

export abstract class Datastore extends IdaiObservable {

    abstract create(object: IdaiFieldObject): Promise<string>;

    abstract update(object: IdaiFieldObject): Promise<any>;

    abstract get(id: string): Promise<IdaiFieldObject>;

    abstract delete(id: string): Promise<any>;

    abstract find(query: string, options: any): Promise<IdaiFieldObject[]>;

    abstract all(options: any): Promise<IdaiFieldObject[]>;
}