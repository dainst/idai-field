import { Field } from 'idai-field-core';
import { UtilTranslations } from './util-translations';

/**
 * @author Thomas Kleinke
 */
export function getInputTypeLabel(inputType: Field.InputType|string, utilTranslations: UtilTranslations) {

    if (inputType === Field.InputType.SIMPLE_INPUT) inputType = Field.InputType.INPUT;
    if (inputType === Field.InputType.SIMPLE_MULTIINPUT) inputType = Field.InputType.MULTIINPUT;

    return utilTranslations.getTranslation('inputTypes.' + inputType);
}
