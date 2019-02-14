import {clone as tsfunClone, jsonClone} from 'tsfun';

/**
 * @author Thomas Kleinke
 * @author Daniel de Oliveira
 */
export function clone<T>(struct: T): T {

    return tsfunClone(struct, ((item: any) => {
        return item instanceof Date
            ? new Date(item)
            : jsonClone(item);
    }));
}