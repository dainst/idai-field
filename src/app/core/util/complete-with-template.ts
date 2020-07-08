import {reduce} from 'tsfun/associative';
import {assoc, isObject} from 'tsfun';


// TODO use in field-category-converter
// TODO move to idai-components-2
export function completeWithTemplate(struct: any, template: any) {

    return reduce((acc: any, val: any, key: any) => {

        return acc[key] !== undefined && !isObject(acc[key])
            ? acc
            : assoc(
                key,
                acc[key] !== undefined
                    ? completeWithTemplate(acc[key], val)
                    : val,
                acc)

    }, struct, template);
}
