import { isString } from 'tsfun';
import { Field } from 'idai-field-core';
import { Validations } from '../model/validations';


/**
 * @author Thomas Kleinke
 */
export module ConvertDataUtil {

    export function isConvertible(fieldContent: any, inputType: Field.InputType): boolean {

        switch (inputType) {
            case Field.InputType.BOOLEAN:
                return ['true', 'false'].includes(fieldContent.toString().toLowerCase());
            case Field.InputType.CHECKBOXES:
                return isString(fieldContent);
            case Field.InputType.INT:
            case Field.InputType.UNSIGNEDINT:
            case Field.InputType.FLOAT:
            case Field.InputType.UNSIGNEDFLOAT:
                return Validations.validateNumberAsString(fieldContent, inputType);
            default:
                return false;
        }
    }


    export function convert(fieldContent: any, inputType: Field.InputType): any {

        switch (inputType) {
            case Field.InputType.BOOLEAN:
                return fieldContent.toLowerCase() === 'true';
            case Field.InputType.CHECKBOXES:
                return [fieldContent]
            case Field.InputType.INT:
            case Field.InputType.UNSIGNEDINT:
                return parseInt(fieldContent);
            case Field.InputType.FLOAT:
            case Field.InputType.UNSIGNEDFLOAT:
                return parseFloat(fieldContent);
            default:
                return fieldContent;
        }
    }
}
