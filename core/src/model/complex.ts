import { intersect, isArray } from 'tsfun';
import { Valuelist } from '.';
import { I18N } from '../tools/i18n';
import { Field, Subfield } from './configuration/field';


/**
 * @author Thomas Kleinke
 */
export module Complex {

    export function isConditionFulfilled(entry: any, subfield: Subfield): boolean {

        if (!subfield.condition) return true;

        const data: any = entry[subfield.condition.subfieldName];
        return data !== undefined
            ? isArray(subfield.condition.values)
                ? isArray(data)
                    ? intersect(data)(subfield.condition.values).length > 0
                    : subfield.condition.values.includes(data)
                : data === subfield.condition.values
            : false;
    }

    
    /**
     * @returns null if no label could be generated because of invalid data
     */
    export function generateLabel(entry: any, subfields: Array<Subfield>,
                                  translate: (term: string) => string,
                                  getFromLabeledValue: (labeledValue: I18N.LabeledValue) => string,
                                  getFromI18NString: (i18nString: I18N.String|string) => string,
                                  getValueLabel: (valuelist: Valuelist, valueId: string) => string): string|null {

        try {
            return subfields.reduce((result, subfield) => {
                const subfieldData: any = entry[subfield.name];
                if (subfieldData === undefined) return result;

                if (result.length !== 0) result += ', ';
                return result
                    + getFromLabeledValue(subfield) + ': '
                    + generateSubfieldLabel(subfieldData, subfield.inputType, translate, getFromI18NString,
                        getValueLabel, subfield.valuelist);
            }, '');
        } catch (err) {
            console.warn('Failed to generate label.', err);
            return null;
        }
    }


    function generateSubfieldLabel(subfieldData: any, inputType: Field.InputType,
                                   translate: (term: string) => string,
                                   getFromI18NString: (i18nString: I18N.String|string) => string,
                                   getValueLabel: (valuelist: Valuelist, valueId: string) => string,
                                   valuelist?: Valuelist): string {

        switch (inputType) {
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
