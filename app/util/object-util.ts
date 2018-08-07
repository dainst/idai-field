import {clone as _clone} from 'tsfun';

// TODO move to document

/**
 * @author Thomas Kleinke
 * @author Daniel de Oliveira
 */

/**
 * Clones the object, keeping the type of Date objects as Date.
 *
 * @param {O} object
 * @returns {O}
 */
export function clone<O>(object: O): O {

    return _clone(object, convertDates);
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
