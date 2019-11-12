import {clone as tsfunClone, jsonClone, getOn} from 'tsfun';
import {setOn} from 'tsfun-extra';

/**
 * @author Thomas Kleinke
 * @author Daniel de Oliveira
 */


export function clone<T>(struct: T): T {

    return tsfunClone(struct, (item: any) => {
        return item instanceof Date
            ? new Date(item)
            : jsonClone(item);
    });
}


/**
 * if o has not already a value at path, it sets it to alternative
 */
export function takeOrMake<T>(o: T, path: string, alternative: any) {

    return setOn(o, path)(getOn(path , alternative)(o));
}
