import {reduce} from 'tsfun/associative';
import {update, isObject} from 'tsfun';


export function completeWithTemplate(struct: any, template: any) {

    return reduce((acc: any, val: any, key: any) => {

        return acc[key] !== undefined && !isObject(acc[key])
            ? acc
            : update(
                key,
                acc[key] !== undefined
                    ? completeWithTemplate(acc[key], val)
                    : val,
                acc)

    }, struct, template);
}
