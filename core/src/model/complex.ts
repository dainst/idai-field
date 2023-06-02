import { Valuelist } from '.';
import { I18N } from '../tools/i18n';
import { Field, Subfield } from './configuration/field';


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


    export function generateLabel(entry: any, subfields: Array<Subfield>,
                                  translate: (term: string) => string,
                                  getFromLabeledValue: (labeledValue: I18N.LabeledValue) => string,
                                  getFromI18NString: (i18nString: I18N.String|string) => string,
                                  getValueLabel: (valuelist: Valuelist, valueId: string) => string): string {

        return subfields.reduce((result, subfield) => {
            const subfieldData: any = entry[subfield.name];
            if (!subfieldData) return result;

            if (result.length !== 0) result += ', ';
            return result
                + getFromLabeledValue(subfield) + ': '
                + generateSubfieldLabel(subfieldData, subfield.inputType, translate, getFromI18NString,
                    getValueLabel, subfield.valuelist);
        }, '');
    }


    function generateSubfieldLabel(subfieldData: any, inputType: Field.InputType,
                                   translate: (term: string) => string,
                                   getFromI18NString: (i18nString: I18N.String|string) => string,
                                   getValueLabel: (valuelist: Valuelist, valueId: string) => string,
                                   valuelist?: Valuelist): string {

        switch(inputType) {
            case Field.InputType.INPUT:
            case Field.InputType.TEXT:
                return getFromI18NString(subfieldData);
            case Field.InputType.MULTIINPUT:
                return subfieldData.map(i18nString => getFromI18NString(i18nString)).join('/');
            case Field.InputType.SIMPLE_MULTIINPUT:
                return subfieldData.join('/');
            case Field.InputType.BOOLEAN:
                return translate(subfieldData);
            case Field.InputType.DROPDOWN:
            case Field.InputType.RADIO:
                return getValueLabel(valuelist, subfieldData);
            case Field.InputType.CHECKBOXES:
                return subfieldData.map(valueId => getValueLabel(valuelist, valueId)).join('/');
            default:
                return subfieldData;
        }
    }
}
