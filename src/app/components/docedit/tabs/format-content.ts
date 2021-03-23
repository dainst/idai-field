import { Dating, Dimension, Literature, OptionalRange, Resource } from 'idai-components-2';
import { FieldDefinition } from 'src/app/core/configuration/model/field-definition';
import { flow, identity, isArray, isObject, isString } from 'tsfun';

export type InnerHTML = string;


/**
 * Right now, there is no translation of field entries. // TODO needed?
 *
 * @author Daniel de Oliveira
 */
export function formatContent(resource: Resource, field: any): InnerHTML {

    const fieldContent = resource[field.name];

    return isArray(fieldContent)
        ? flow(fieldContent,
            convertArray(field.inputType),
            formatArray)
        : isObject(fieldContent)
        ? flow(fieldContent,
            convertObject(field.inputType),
            formatObject)
        : fieldContent;
}


function formatArray(fieldContent: Array<string>): InnerHTML {

    let contentString: string = '<div>[';
    for (let element of fieldContent) {
        if (contentString.length > 6) contentString += ',';
        contentString += '<br>';
        contentString += '&nbsp;&nbsp;"' + element + '"';
    }
    return contentString += '</div>]';
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


const convertArray = (inputType?: FieldDefinition.InputType) =>
                     (fieldContent: Array<any>): Array<string> => {


    return fieldContent.map(element => {

        if (inputType === 'dimension' && Dimension.isDimension(element)) {
            return Dimension.generateLabel(element, identity, identity);
        }
        else if (inputType === 'dating' && Dating.isDating(element)) {
            return Dating.generateLabel(element, identity);
        }
        else if (inputType === 'literature' && Literature.isLiterature(element)) {
            return Literature.generateLabel(element, identity)
        }
        else return JSON.stringify(element);
    });
}
