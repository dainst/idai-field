import { clone, filter, includedIn, isArray, isNot } from 'tsfun';
import { Document } from '../model/document';
import { Field } from '../model';
import { Resource } from '../model/resource';
import { ValuelistValue, Valuelist } from '../model';


/**
 * @author Daniel de Oliveira
 * @author Thomas Kleinke
 */
export module ValuelistUtil {

    export function getValuesNotIncludedInValuelist(fieldContent: any, valuelist: Valuelist): string[]|undefined {

        if (!fieldContent || !valuelist) return undefined;

        const itemsNotIncludedInValuelist = isArray(fieldContent)
            ? fieldContent.filter(isNot(includedIn(Object.keys(valuelist.values))))
            : isNot(includedIn(Object.keys(valuelist.values)))(fieldContent)
                ? [fieldContent]
                : [];

        return itemsNotIncludedInValuelist.length > 0 ? itemsNotIncludedInValuelist : undefined;
    }


    export function getValuelist(field: Field, 
                                 projectDocument: Document,
                                 parentResource?: Resource): Valuelist {

        const valuelist: Valuelist|string[] = field.valuelist
            ? field.valuelist
            : getValuelistFromProjectField(field.valuelistFromProjectField as string, projectDocument);

        return field.allowOnlyValuesOfParent && parentResource
                && parentResource.category !== 'Place'
            ? getValuesOfParentField(valuelist, field.name, parentResource)
            : valuelist;
    }


    export function getValuelistFromProjectField(fieldName: string,
                                                 projectDocument: Document): Valuelist {

        const id = 'project-' + fieldName;
        const field: string[]|undefined = projectDocument.resource[fieldName];

        return field && isArray(field)
            ? {
                values: field.reduce((values: { [fieldId: string]: ValuelistValue }, fieldName: string) => {
                    values[fieldName] = {};
                    return values;
                }, {}), id: id
            }
        : { values: {}, id: id };
    }


    function getValuesOfParentField(valuelist: Valuelist, 
                                    fieldName: string,
                                    parentResource: Resource): Valuelist {

        const parentValues: string[] = parentResource[fieldName] ?? [];

        const result: Valuelist = clone(valuelist);
        result.values = filter((_, key: string) => {
            return parentValues.includes(key);
        })(valuelist.values) as { [key: string]: ValuelistValue };

        return result;
    }
}
