import {IdaiFieldObject} from "../model/idai-field-object";

export abstract class Datastore {

    abstract initialize(): Promise<any>;

    abstract save(object: IdaiFieldObject): Promise<any>;

    abstract get(id: string): Promise<IdaiFieldObject>;

    abstract find(query: string, options: any): Promise<IdaiFieldObject[]>;

    abstract all(options: any): Promise<IdaiFieldObject[]>;
}