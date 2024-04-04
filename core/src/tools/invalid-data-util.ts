import { isArray, isObject, isString } from 'tsfun';
import { Labels } from '../services/labels';
import { StringUtils } from './string-utils';
import { Field } from '../model/configuration/field';


/**
 * @author Thomas Kleinke
 */
export module InvalidDataUtil {

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


    export function generateLabel(data: any, labels: Labels): string {

        const entries: any[] = isArray(data) ? data : [data];

        return entries.map(entry => generateValueLabel(entry, labels))
            .filter(entry => entry?.length)
            .join('<hr>');
    }


    function generateValueLabel(value: any, labels: Labels): string {

        if (value === undefined) {
            return '';
        } else if (isArray(value)) {
            return generateArrayLabel(value, labels);
        } else if (isObject(value)) {
            return generateObjectLabel(value, labels);
        } else {
            return value.toString();
        }
    }


    function generateArrayLabel(value: any[], labels: Labels): string {

        return value.map(valueEntry => generateValueLabel(valueEntry, labels)).join('/');
    }


    function generateObjectLabel(value: any, labels: Labels): string {

        const label: string|undefined = labels.getFromI18NString(value);
    
        return label && isString(label)
            ? StringUtils.prepareStringForHTML(label)
            : Object.keys(value).map(key => {
                return key + ': ' + generateValueLabel(value[key], labels);
            }).join(', ');
    }
}
