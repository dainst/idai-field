import {equals, equalTo, clone} from 'tsfun';

/**
 * @author Thomas Kleinke
 * @author Daniel de Oliveira
 */
export module ObjectUtil {

    /**
     * Clones the object, keeping the type of Date objects as Date.
     *
     * @param {O} object
     * @returns {O}
     */
    export function cloneWithDates<O>(object: O): O {

        return clone(object, convertDates);
    }


    function convertDates<O>(original: any, plain: any) {

        if (original) {
            for (let key of Object.keys(original)) {

                if (original[key] instanceof Date) {
                    plain[key] = new Date(original[key]);
                } else if (typeof original[key] === 'object') {
                    convertDates(original[key], plain[key])
                }

            }
        }
        return plain;

    }
}
