import {IdaiFieldObject} from "../model/idai-field-object";

export abstract class Datastore {

    abstract getObjects(): IdaiFieldObject[];
}