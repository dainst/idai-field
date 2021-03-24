import {update, isObject,keysAndValues} from 'tsfun';


export function completeWithTemplate(struct: any, template: any) {

    return keysAndValues(template).reduce((acc: any, [key,val]) => {

        return acc[key] !== undefined && !isObject(acc[key])
            ? acc
            : update(
                key,
                acc[key] !== undefined
                    ? completeWithTemplate(acc[key], val)
                    : val,
                acc)

    }, struct);
}
