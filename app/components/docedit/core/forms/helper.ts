import {Resource} from 'idai-components-2/src/model/core/resource';
import {includedIn, isNot, isArray} from 'tsfun';


// @author Daniel de Oliveira




export module Helper {

    export function notIncludedInValueList(resource: Resource|undefined, fieldName: string|undefined, valuelist: string[]|undefined) {

        if (!resource || !fieldName || !resource[fieldName] || !valuelist) return undefined;

        const itemsNotIncludedInValueList = isArray(resource[fieldName])
            ? resource[fieldName].filter(isNot(includedIn(valuelist)))
            : isNot(includedIn(valuelist))(resource[fieldName])
                ? [resource[fieldName]]
                : [];

        return itemsNotIncludedInValueList.length > 0 ? itemsNotIncludedInValueList : undefined;
    }
}

