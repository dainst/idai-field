import {isAssociative, isPrimitive, map} from 'tsfun';


/**
 * @author Thomas Kleinke
 * @author Daniel de Oliveira
 */
export module ObjectUtils {

    export const jsonEqual = (l: any) => (r: any) => JSON.stringify(l) === JSON.stringify(r);

    export function jsonClone(x: any) { return JSON.parse(JSON.stringify(x)); }
}
