import {IdaiFieldObject} from "./idai-field-object";

/**
 * @author Daniel M. de Oliveira
 * @author Jan G. Wieners
 */
export class ModelUtils {

    /**
     *
     * @param object
     * @returns new IdaiFieldObject without the properties which we don't want
     *   to be sent to the backend.
     */
    public static filterUnwantedProps(object: IdaiFieldObject) : IdaiFieldObject {

        var o = JSON.parse(JSON.stringify(object));

        delete o.synced;
        delete o.id;

        return o;
    }
}