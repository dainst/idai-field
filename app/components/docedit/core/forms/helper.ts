import {includedIn, isNot, isArray} from 'tsfun';
import {Document, Resource} from 'idai-components-2';
import {FieldDefinition} from '../../../../core/configuration/model/field-definition';

/**
 * @author Daniel de Oliveira
 * @author Thomas Kleinke
 */
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


    export function getValuelist(field: FieldDefinition, projectDocument: Document): string[] {

        return field.valuelist
            ? field.valuelist
            : getValuelistFromProjectField(field.valuelistFromProjectField as string, projectDocument);
    }


    function getValuelistFromProjectField(fieldName: string, projectDocument: Document): string[] {

        const field: string[]|undefined = projectDocument.resource[fieldName];
        return field && Array.isArray(field) ? field : [];
    }
}

