import {reduce} from 'tsfun/associative';
import {assoc, isObject} from 'tsfun';


// TODO move to idai-components-2
export module Templating {

    // TODO use in field-category-converter
    export function complateWithTemplate(struct: any, template: any) {

        return reduce((acc: any, val: any, key: any) => {

            return acc[key] !== undefined && !isObject(acc[key])
                ? acc
                : assoc(
                    key,
                    acc[key] !== undefined
                        ? complateWithTemplate(acc[key], val)
                        : val,
                    acc)

        }, struct, template);
    }
}
