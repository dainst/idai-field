import {IdaiFieldObject} from "./idai-field-object";

/**
 * @author Daniel M. de Oliveira
 * @author Jan G. Wieners
 */
export class ModelUtils {

    /**
     *
     * @param object
     * @param properties
     * @returns new IdaiFieldObject without the properties which we don't want
     *   to be sent to the backend.
     */
    public static filterUnwantedProps(object: IdaiFieldObject, properties?: string[]) : IdaiFieldObject {

        var o = JSON.parse(JSON.stringify(object));

        if (properties) {
            for (var i = properties.length; i--;) {
                delete o[properties[i]];
            }
        }
        return o;
    }
}