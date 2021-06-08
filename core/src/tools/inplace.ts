import {isNumber, isString, to, Path} from 'tsfun';


/**
 * Inplace modifications of Structs (nested arrays or objects, as per {} and [])
 */
export namespace Inplace {

    export function setOn(object: any, path_: Path) {

        return (val: any): void => _setOn(object, isString(path_)||isNumber(path_)?[path_]:path_, val);
    }
    
    
    /**
     * if o has not already a value at path, it sets it to alternative
     */
    export function takeOrMake<T>(o: T, path: Path, alternative: any) {
    
        return setOn(o, path)(to(path, alternative)(o));
    }
    
    
    export function moveInArray<T>(array: Array<T>, originalIndex: number, targetIndex: number) {
    
        array.splice(targetIndex, 0, array.splice(originalIndex, 1)[0]);
    }
    
    
    function _setOn(object: any, path: Array<string|number>, val: any) {
    
        const key = path[0];
    
        if (path.length === 1) {
            object[key] = val;
        } else {
            path.shift();
            if (!object[key]) {
                object[key] = isString(key)
                    ? {}
                    : [];
            }
            _setOn(object[key], path, val);
        }
    }
}