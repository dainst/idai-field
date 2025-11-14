import { isObject } from 'tsfun';
import { I18N } from '../../tools/i18n';
import { Field, Subfield } from '../configuration/field';
import { Valuelist } from '../configuration/valuelist';
import { Condition } from '../configuration/condition';
import { DateSpecification } from './date-specification';


/**
 * @author Thomas Kleinke
 */
export module Composite {

    export function isValid(entry: any, subfields: Array<Subfield>): boolean {

        if (!entry || !isObject(entry)) return false;

        return Object.keys(entry).find(subfieldName => {
            const subfieldDefinition: Subfield = subfields.find(subfield => subfield.name === subfieldName);
            return !subfieldDefinition
                || !Field.isValidFieldData(entry[subfieldName], subfieldDefinition)
                || !Condition.isFulfilled(subfieldDefinition.condition, entry, subfields, 'subfield');
        }) === undefined;
    }

    
    /**
     * @returns null if no label could be generated because of invalid data
     */
    export function generateLabel(entry: any, subfields: Array<Subfield>, timezone: string, timeSuffix: string,
                                  locale: string, translate: (term: string) => string,
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
                    + generateSubfieldLabel(subfieldData, subfield.inputType, timezone, timeSuffix, locale, translate,
                        getFromI18NString, getValueLabel, subfield.valuelist);
            }, '');
        } catch (err) {
            console.warn('Failed to generate label.', err);
            return null;
        }
    }


    function generateSubfieldLabel(subfieldData: any, inputType: Field.InputType, timezone: string, timeSuffix: string,
                                   locale: string, translate: (term: string) => string,
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
            case Field.InputType.DATE:
                return DateSpecification.generateLabel(
                    subfieldData, timezone, timeSuffix, locale, (term: string) => translate(term), true, false
                );
            default:
                return subfieldData;
        }
    }
}
