import {IdaiFieldObject} from "./model/idai-field-object";

/**
 * @author Daniel M. de Oliveira
 */
export class Utils {

    public static deepCopyObject(from: IdaiFieldObject,to: IdaiFieldObject) {
        to.identifier = from.identifier;
        to.title = from.title;
        to.synced = from.synced;
    }
}