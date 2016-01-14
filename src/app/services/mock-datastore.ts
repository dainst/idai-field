import {IdaiFieldObject} from "../model/idai-field-object";
import {Datastore} from "./datastore";
import {Injectable} from "angular2/core";

import {OBJECTS} from "./sample-objects";

@Injectable()
export class MockDatastore implements Datastore {

    getObjects(): IdaiFieldObject[] {

        return OBJECTS;
    }

}