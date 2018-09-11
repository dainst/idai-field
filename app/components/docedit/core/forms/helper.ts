import {Resource} from 'idai-components-2/src/model/core/resource';
import {includedIn, isNot} from 'tsfun';


// @author Daniel de Oliveira




export module Helper {

    export function notIncludedInValueList(resource: Resource|undefined, fieldName: string|undefined, valuelist: string[]|undefined) {

        if (!resource || !fieldName || !resource[fieldName] || !valuelist) return undefined;

        const result = resource[fieldName].filter(isNot(includedIn(valuelist)));

        return (result.length > 0) ? result : undefined;
    }
}

