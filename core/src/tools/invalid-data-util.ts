import { isArray, isObject, isString } from 'tsfun';
import { Labels } from '../services/labels';
import { StringUtils } from './string-utils';


/**
 * @author Thomas Kleinke
 */
export module InvalidDataUtil {

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
            return value;
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
