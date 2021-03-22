import { Dating, Dimension, Literature, OptionalRange, Resource } from 'idai-components-2';
import { FieldDefinition } from 'src/app/core/configuration/model/field-definition';
import { flow, identity, isArray, isString } from 'tsfun';

export type InnerHTML = string;


/**
 * Right now, there is no translation of field entries. // TODO needed?
 * 
 * @author Daniel de Oliveira
 */
export function formatContent(resource: Resource, field: any): InnerHTML {

    const fieldContent = resource[field.name];

    return !isArray(fieldContent) 
        ? JSON.stringify(fieldContent) /* TODO review possible object types */
        : flow(fieldContent, 
            convertArray(field.inputType), 
            formatArray);
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


const convertArray = (inputType?: FieldDefinition.InputType) => 
                     (fieldContent: Array<any>): Array<string> => {

    return fieldContent.map(element => {

        if (inputType === 'dimension' && Dimension.isDimension(element)) {
            return Dimension.generateLabel(element, identity, identity /* TODO review */);
        }
        else if (inputType === 'dating' && Dating.isDating(element)) {
            return Dating.generateLabel(element, identity);
        }
        else if (inputType === 'dropdownRange' && OptionalRange.buildIsOptionalRange(isString)(element)) {
            return OptionalRange.generateLabel(element, identity, identity /* TODO review */);
        }
        else if (inputType === 'literature' && Literature.isLiterature(element)) {
            return Literature.generateLabel(element, identity /*, zenonId? */)
        }
        else return JSON.stringify(element);
    });
}
