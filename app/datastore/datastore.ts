import {IdaiFieldObject} from "../model/idai-field-object";
import {ReadDatastore} from "./read-datastore";

export abstract class Datastore extends ReadDatastore {

    abstract create(object: IdaiFieldObject): Promise<string>;

    abstract update(object: IdaiFieldObject): Promise<any>;

    abstract remove(id: string): Promise<any>;

    abstract clear(): Promise<any>;

    abstract refresh(id:string):Promise<IdaiFieldObject>;
}