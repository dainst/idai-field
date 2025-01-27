import { filter, includedIn, isArray, isDefined, isNot, isObject, isString } from 'tsfun';
import { Document } from '../model/document/document';
import { Resource } from '../model/document/resource';
import { Valuelist } from '../model/configuration/valuelist';
import { OptionalRange } from '../model/input-types/optional-range';
import { ValuelistValue } from '../model/configuration/valuelist-value';
import { Field } from '../model/configuration/field';
import { CategoryForm, Dimension, EditableValue } from '../model';
import { ProjectConfiguration } from '../services';


/**
 * @author Daniel de Oliveira
 * @author Thomas Kleinke
 */
export module ValuelistUtil {

    export function getValuesNotIncludedInValuelist(fieldContent: any, valuelist: Valuelist): string[]|undefined {

        if (!fieldContent || !valuelist) return undefined;
        
        const valuesToCheck: string[] = isArray(fieldContent)
            ? fieldContent.map(entry => entry?.[Dimension.MEASUREMENTPOSITION] ?? entry)
                .filter(entry => isString(entry))
            : fieldContent[OptionalRange.VALUE]
                ? [fieldContent[OptionalRange.VALUE], fieldContent[OptionalRange.ENDVALUE]]
                : [fieldContent];

        const itemsNotIncludedInValuelist = valuesToCheck
            .filter(isDefined)
            .filter(value => value.length)
            .filter(isNot(includedIn(Object.keys(valuelist.values))));

        return itemsNotIncludedInValuelist.length > 0 ? itemsNotIncludedInValuelist : undefined;
    }


    /**
     * @param valuesToInclude These values will always be kept even if unselectable
     */
    export function getValuelist(field: Field, projectDocument: Document, projectConfiguration: ProjectConfiguration,
                                 parentResource?: Resource, valuesToInclude?: string[],
                                 includeUnselectable: boolean = false): Valuelist {

        const valuelist: Valuelist|string[] = field.valuelist
            ? field.valuelist
            : field.valuelistFromProjectField
                ? getValuelistFromProjectField(
                    field.valuelistFromProjectField, projectDocument, valuesToInclude, includeUnselectable
                ) : undefined;
        if (!valuelist) return undefined;

        const parentCategory: CategoryForm = parentResource ?
            projectConfiguration.getCategory(parentResource.category)
            : undefined;

        return field.allowOnlyValuesOfParent && parentResource
                && CategoryForm.getFields(parentCategory).find(parentField => parentField.name === field.name)
            ? getValuesOfParentField(valuelist, field.name, parentResource)
            : valuelist;
    }


    export function getValuelistFromProjectField(fieldName: string, projectDocument: Document,
                                                 valuesToInclude?: string[],
                                                 includeUnselectable: boolean = false): Valuelist {

        const valuelistId: string = 'project-' + fieldName;
        const fieldData: Array<EditableValue>|undefined = projectDocument.resource[fieldName];

        if (!fieldData || !isArray(fieldData) || !fieldData.every(element => isObject(element) && element.value)) {
            return { values: {}, id: valuelistId };
        }

        const values: { [valueId: string]: ValuelistValue } = fieldData.reduce((values, entry) => {
            if (entry.selectable || includeUnselectable || valuesToInclude?.includes(entry.value)) {
                values[entry.value] = {};
            }
            return values;
        }, {});
        
        return {
            values, id: valuelistId
        };
    }


    function getValuesOfParentField(valuelist: Valuelist, fieldName: string, parentResource: Resource): Valuelist {

        const parentValues: string[] = parentResource[fieldName] ?? [];

        return {
            id: valuelist.id,
            values: filter((_, key: string) => {
                return parentValues.includes(key);
            })(valuelist.values) as { [key: string]: ValuelistValue }
        };
    }
}
