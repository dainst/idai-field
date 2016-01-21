import {IdaiFieldObject} from "../model/idai-field-object";
import {Datastore} from "./datastore";
import {Injectable} from "angular2/core";
import {IdGenerator} from "./id-generator";
import {IdaiObserver} from "../idai-observer";

@Injectable()
export class MockDatastore implements Datastore {
    subscribe(observer:IdaiObserver) {
    }

    private db: { [key:string]:IdaiFieldObject } = {};

    create(object: IdaiFieldObject):Promise<any> {
        object._id = IdGenerator.generateId();
        this.db[object._id] = object;
        return Promise.resolve(object._id);
    }

    update(object: IdaiFieldObject):Promise<any> {
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