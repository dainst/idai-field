import { includedIn, isArray, isDefined, isNot, isObject, isString } from 'tsfun';
import { Document } from '../model/document/document';
import { Valuelist } from '../model/configuration/valuelist';
import { OptionalRange } from '../model/input-types/optional-range';
import { ValuelistValue } from '../model/configuration/valuelist-value';
import { Field } from '../model/configuration/field';
import { Measurement } from '../model/input-types/measurement';
import { EditableValue } from '../model/input-types/editable-value';


/**
 * @author Daniel de Oliveira
 * @author Thomas Kleinke
 */
export module ValuelistUtil {

    export function getValuesNotIncludedInValuelist(fieldContent: any, valuelist: Valuelist): string[]|undefined {

        if (!fieldContent || !valuelist) return undefined;
        
        const valuesToCheck: string[] = isArray(fieldContent)
            ? fieldContent.map(entry => entry?.[Measurement.MEASUREMENTPOSITION]
                    ?? entry?.[Measurement.MEASUREMENTDEVICE]
                    ?? entry)
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
    export function getValuelist(field: Field, projectDocument: Document, valuesToInclude?: string[],
                                 includeUnselectable: boolean = false): Valuelist {

        if (field.valuelist) return field.valuelist;

        return field.valuelistFromProjectField
            ? getValuelistFromProjectField(
                field.valuelistFromProjectField, projectDocument, valuesToInclude, includeUnselectable
            ) : undefined;
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
}
