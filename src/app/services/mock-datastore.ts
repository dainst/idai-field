import {IdaiFieldObject} from "../model/idai-field-object";
import {Datastore} from "./datastore";
import {Injectable} from "angular2/core";

import {OBJECTS} from "./sample-objects";

@Injectable()
export class MockDatastore implements Datastore {

    save(object: IdaiFieldObject):Promise<any> {
        return Promise.resolve({success: true});
    }

    get(id:string):Promise<IdaiFieldObject> {
        return Promise.resolve(OBJECTS[id]);
    }

    find(query:string, options:any):Promise<IdaiFieldObject[]> {
        return Promise.resolve(OBJECTS);
    }

    all(options:any):Promise<IdaiFieldObject[]> {
        return Promise.resolve(OBJECTS);
    }

}