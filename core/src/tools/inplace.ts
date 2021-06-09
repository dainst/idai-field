import { isNumber, isString, to, Path, take, isEmpty } from 'tsfun';


/**
 * @author Daniel de Oliveira
 * @author Thomas Kleinke
 * 
 * Inplace modifications of Structs (nested arrays or objects, as per {} and [])
 */
export namespace Inplace {

    export function setOn(object: any, path_: Path) {

        return (value: any): void => _setOn(object, isString(path_) || isNumber(path_) ? [path_] : path_, value);
    }

    
    export function removeFrom(object: any, path_: Path) {

        return _removeFrom(object, isString(path_) || isNumber(path_) ? [path_] : path_);
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
    
    
    function _setOn(object: any, path: Array<string|number>, value: any) {
    
        const key: string|number = path[0];
    
        if (path.length === 1) {
            object[key] = value;
        } else {
            path.shift();
            if (!object[key]) {
                object[key] = isString(key)
                    ? {}
                    : [];
            }
            _setOn(object[key], path, value);
        }
    }


    function _removeFrom(object: any, path: Array<string|number>, removeOnlyIfEmpty: boolean = false) {

        let currentObject: any = object;

        for (let i = 0; i < path.length - 1; i++) {
            currentObject = currentObject[path[i]];
            if (!currentObject) return;
        }

        const key: string|number = path[path.length - 1];
        if (!key) return;

        if (!removeOnlyIfEmpty || isEmpty(currentObject[key])) {
            if (isString(key)) {
                delete currentObject[key];
            } else {
                currentObject.splice(key, 1);
            }
            _removeFrom(object, take(path.length - 1)(path), true);
        }
    }
}
