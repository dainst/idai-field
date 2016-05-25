import {Entity} from "../core-services/entity";
import {ReadDatastore} from "./read-datastore";

export abstract class Datastore extends ReadDatastore {

    abstract create(object: Entity): Promise<string>;

    abstract update(object: Entity): Promise<any>;

    abstract remove(id: string): Promise<any>;

    abstract clear(): Promise<any>;

    abstract refresh(id:string):Promise<Entity>;
}