import { isString } from 'tsfun';
import { Field } from 'idai-field-core';


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
            default:
                return fieldContent;
        }
    }
}
