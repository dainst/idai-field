import { clone, filter, includedIn, isArray, isDefined, isNot, isString } from 'tsfun';
import { Document } from '../model/document';
import { Resource } from '../model/resource';
import { Valuelist } from '../model/configuration/valuelist';
import { OptionalRange } from '../model/optional-range';
import { ValuelistValue } from '../model/configuration/valuelist-value';
import { Field } from '../model/configuration/field';
import { Dimension } from '../model';


/**
 * @author Daniel de Oliveira
 * @author Thomas Kleinke
 */
export module ValuelistUtil {

    export function getValuesNotIncludedInValuelist(fieldContent: any, valuelist: Valuelist): string[]|undefined {

        if (!fieldContent || !valuelist) return undefined;
        
        const valuesToCheck: string[] = isArray(fieldContent)
            ? fieldContent.map(entry => entry[Dimension.MEASUREMENTPOSITION] ?? entry)
                .filter(entry => isString(entry))
            : fieldContent[OptionalRange.VALUE]
                ? [fieldContent[OptionalRange.VALUE], fieldContent[OptionalRange.ENDVALUE]]
                : [fieldContent];

        const itemsNotIncludedInValuelist = valuesToCheck
            .filter(isDefined)
            .filter(isNot(includedIn(Object.keys(valuelist.values))));

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
