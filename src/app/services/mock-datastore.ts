import {IdaiFieldObject} from "../model/idai-field-object";
import {Datastore} from "./datastore";
import {Injectable} from "angular2/core";

@Injectable()
export class MockDatastore implements Datastore {

    private db: { [key:string]:IdaiFieldObject } = {};

    save(object: IdaiFieldObject):Promise<any> {
        this.db[object._id] = object;
        return Promise.resolve();
    }

    get(id:string):Promise<IdaiFieldObject> {
        return Promise.resolve(this.db[id]);
    }

    delete(id:string):Promise<any> {
        delete this.db[id];
        return Promise.resolve();
    }

    find(query:string, options:any):Promise<IdaiFieldObject[]> {
        return Promise.resolve(Object.keys(this.db).map((k) => this.db[k]));
    }

    all(options:any):Promise<IdaiFieldObject[]> {
        return Promise.resolve(Object.keys(this.db).map((k) => this.db[k]));
    }

}