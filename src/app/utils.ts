import {IdaiFieldObject} from "./model/idai-field-object";

/**
 * @author Daniel M. de Oliveira
 */
export class Utils {

    /**
     * Copies all properties from one existing IdaiFieldObject to another
     *   existing IdaiFieldObject.
     * @param from
     * @param to
     */
    public static deepCopy(from: IdaiFieldObject, to: IdaiFieldObject) {
        to._id = from._id;
        to.identifier = from.identifier;
        to.title = from.title;
        to.synced = from.synced;
    }

    /**
     * @param from
     * @returns a new object which has all of the properties of from
     *   IdaiFieldObject.
     */
    public static clone(from: IdaiFieldObject) : IdaiFieldObject {

        var cloned = { identifier: "", title: "", synced: true};
        Utils.deepCopy(from,cloned);
        return cloned;
    }
}