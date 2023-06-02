import { Field } from './configuration/field';


/**
 * @author Thomas Kleinke
 */
export module Complex {

    export const ALLOWED_SUBFIELD_INPUT_TYPES = [
        Field.InputType.INPUT,
        Field.InputType.SIMPLE_INPUT,
        Field.InputType.MULTIINPUT,
        Field.InputType.SIMPLE_MULTIINPUT,
        Field.InputType.TEXT,
        Field.InputType.BOOLEAN,
        Field.InputType.DROPDOWN,
        Field.InputType.RADIO,
        Field.InputType.CHECKBOXES,
        Field.InputType.FLOAT,
        Field.InputType.UNSIGNEDFLOAT,
        Field.InputType.INT,
        Field.InputType.UNSIGNEDINT,
        Field.InputType.DATE,
        Field.InputType.URL
    ];
}
