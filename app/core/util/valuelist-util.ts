import {includedIn, isNot, isArray} from 'tsfun';
import {Document, Resource} from 'idai-components-2';
import {FieldDefinition} from '../configuration/model/field-definition';

/**
 * @author Daniel de Oliveira
 * @author Thomas Kleinke
 */
export module ValuelistUtil {

    export function getValuesNotIncludedInValuelist(resource: Resource|undefined, fieldName: string|undefined,
                                                    valuelist: string[]|undefined): string[]|undefined {

        if (!resource || !fieldName || !resource[fieldName] || !valuelist) return undefined;

        const itemsNotIncludedInValueList = isArray(resource[fieldName])
            ? resource[fieldName].filter(isNot(includedIn(valuelist)))
            : isNot(includedIn(valuelist))(resource[fieldName])
                ? [resource[fieldName]]
                : [];

        return itemsNotIncludedInValueList.length > 0 ? itemsNotIncludedInValueList : undefined;
    }


    export function getValuelist(field: FieldDefinition, projectDocument: Document,
                                 parentResource?: Resource): string[] {

        const valuelist: string[] = field.valuelist
            ? field.valuelist
            : getValuelistFromProjectField(field.valuelistFromProjectField as string, projectDocument);

        return field.allowOnlyValuesOfParent && parentResource
                && parentResource.type !== 'Place' // TODO Implement generic solution; check if field is defined in parent type
            ? getValuesOfParentField(valuelist, field.name, parentResource)
            : valuelist;
    }


    export function getValuelistFromProjectField(fieldName: string, projectDocument: Document): string[] {

        const field: string[]|undefined = projectDocument.resource[fieldName];
        return field && isArray(field) ? field : [];
    }


    function getValuesOfParentField(valuelist: string[], fieldName: string,
                                    parentResource: Resource): string[] {

        const parentValues: string[] = parentResource[fieldName] || [];
        return valuelist.filter(includedIn(parentValues));
    }
}

