import { flow, identity, isArray, isObject, isString } from 'tsfun';
import { Dating, Dimension, Literature, OptionalRange, Resource, FieldDefinition } from 'idai-field-core';
import { ValuelistUtil } from '../../../core/util/valuelist-util';


export type InnerHTML = string;


/**
 * @author Daniel de Oliveira
 */
export function formatContent(resource: Resource, field: any): InnerHTML {

    const fieldContent = resource[field.name];

    return isArray(fieldContent)
        ? flow(fieldContent,
            convertArray(field),
            formatArray)
        : isObject(fieldContent)
        ? flow(fieldContent,
            convertObject(field.inputType),
            formatObject)
        : fieldContent;
}


function formatArray(fieldContent: Array<string>): InnerHTML {

    let contentString: string = '<div>';
    for (let i = 0; i < fieldContent.length; i++) {
        if (contentString.length > 6) contentString;
        if (i !== 0) contentString += '<br>';
        contentString += fieldContent[i];
    }
    return contentString += '</div>';
}


function formatObject(fieldContent: string): InnerHTML {

    return fieldContent; // currently not special handling
}


const convertObject = (inputType?: FieldDefinition.InputType) =>
                      (fieldContent: any) => {

    if (inputType === 'dropdownRange' && OptionalRange.buildIsOptionalRange(isString)(fieldContent)) {
        return OptionalRange.generateLabel(fieldContent, identity, identity);
    }
    return JSON.stringify(fieldContent);
}


const convertArray = (field?: FieldDefinition) =>
                     (fieldContent: Array<any>): Array<string> => {

    return fieldContent.map(element => {

        if (field.inputType === 'dimension' && Dimension.isDimension(element)) {
            return Dimension.generateLabel(element, identity, identity, ValuelistUtil.getValueLabel(field.positionValues, element.measurementPosition));
        } else if (field.inputType === 'dating' && Dating.isDating(element)) {
            return Dating.generateLabel(element, identity);
        } else if (field.inputType === 'literature' && Literature.isLiterature(element)) {
            return Literature.generateLabel(element, identity)
        } else if (isString(element)) {
            return element;
        } else {
            return JSON.stringify(element);
        }
    });
}
