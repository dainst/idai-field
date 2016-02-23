import {IdaiFieldObject} from "./idai-field-object";

/**
 * @author Daniel M. de Oliveira
 */
export class ModelUtils {

    /**
     * @param from
     * @returns a new object which has all of the properties of from
     *   IdaiFieldObject.
     */
    public static clone(from: IdaiFieldObject) : IdaiFieldObject {
        return JSON.parse(JSON.stringify(from));
    }
}