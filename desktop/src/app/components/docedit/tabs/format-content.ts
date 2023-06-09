import { flow, isArray, isObject, isString, map, Map, to } from 'tsfun';
import { Complex, Dating, Dimension, Field, I18N, Labels, Literature, OptionalRange, Resource,
    Valuelist } from 'idai-field-core';
import { Language } from '../../../services/languages';

export type InnerHTML = string;


/**
 * @author Daniel de Oliveira
 */
export function formatContent(resource: Resource, field: any,
                              getTranslation: (key: string) => string,
                              transform: (value: any) => string|null,
                              labels: Labels, languages: Map<Language>): InnerHTML {

    const fieldContent = resource[field.name];

    return isArray(fieldContent)
        ? flow(fieldContent,
            convertArray(field, languages, getTranslation, transform, labels),
            formatArray)
        : isObject(fieldContent)
        ? flow(fieldContent,
            convertObject(field, languages, getTranslation, labels),
            formatObject)
        : formatSingleValue(fieldContent, field, getTranslation);
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

    return fieldContent; // currently no special handling
}


const formatSingleValue = (fieldContent: any, field: any, getTranslation: (key: string) => string) => {

    if (field.inputType === 'boolean') {
        return getTranslation(JSON.stringify(fieldContent));
    } else {
        return fieldContent;
    }
};


const convertObject = (field: any, languages: Map<Language>,
                       getTranslation: (key: string) => string, labels: Labels) =>
        (fieldContent: any) => {

    if (field.inputType === 'dropdownRange' && OptionalRange.buildIsOptionalRange(isString)(fieldContent)) {
        return OptionalRange.generateLabel(
            fieldContent,
            getTranslation,
            (value: string) => labels.getValueLabel(field.valuelist, value)
        );
    } else if (field.inputType === 'input') {
        return I18N.getFormattedContent(fieldContent, map(to('label'))(languages));
    } else {
        return JSON.stringify(fieldContent);
    }
};


const convertArray = (field: any, languages: Map<Language>, getTranslation: (key: string) => string,
                      transform: (value: any) => string|null, labels: Labels) =>
        (fieldContent: Array<any>): Array<string> => {

    return fieldContent.map(element => {

        if (field.inputType === Field.InputType.COMPLEX) {
            const label: string|null = Complex.generateLabel(element, field.subfields, getTranslation,
                (labeledValue: I18N.LabeledValue) => labels.get(labeledValue),
                (value: I18N.String|string) => labels.getFromI18NString(value),
                (valuelist: Valuelist, valueId: string) => labels.getValueLabel(valuelist, valueId));
            return label ?? JSON.stringify(element);
        } else if (field.inputType === Field.InputType.DIMENSION && Dimension.isDimension(element)) {
            return Dimension.generateLabel(element, transform, getTranslation,
                (value: I18N.String|string) => labels.getFromI18NString(value),
                labels.getValueLabel(field.valuelist, element.measurementPosition));
        } else if (field.inputType === Field.InputType.DATING && Dating.isDating(element)) {
            return Dating.generateLabel(element, getTranslation,
                (value: I18N.String|string) => labels.getFromI18NString(value));
        } else if (field.inputType === Field.InputType.LITERATURE && Literature.isLiterature(element)) {
            return Literature.generateLabel(element, getTranslation)
        } else if (field.inputType === Field.InputType.MULTIINPUT) {
            return I18N.getFormattedContent(element, map(to('label'))(languages));
        } else if (isString(element)) {
            return field.valuelist ? labels.getValueLabel(field.valuelist, element) : element;
        } else {
            return JSON.stringify(element);
        }
    });
};
