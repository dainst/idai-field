import {jsonClone} from 'tsfun';

// @author Thomas Kleinke
// @author Daniel de Oliveira


export function clone<O>(object: O): O {

    return convertDates(object, jsonClone(object));
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