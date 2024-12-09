import { flow, cond, on, isUndefinedOrEmpty, detach, isObject } from 'tsfun';
import { I18N } from '../../tools/i18n';


/**
 * @author Sebastian Cuy
 * @author Thomas Kleinke
 * @author Daniel de Oliveira
 */
export interface Dating {

    type: Dating.Types,

    begin?: DatingElement,
    end?: DatingElement,

    margin?: number,
    source?: I18N.String|string,
    isImprecise?: boolean,
    isUncertain?: boolean,

    label?: string  // Deprecated
}


export interface DatingElement {

    // Normalized value calculated from input values
    year: number;

    // Input values as typed in by the user
    inputYear: number;
    inputType: DatingType;
}


export type DatingType = 'bce'|'ce'|'bp';


export module Dating {

    export const TYPE = 'type';
    export const BEGIN = 'begin';
    export const END = 'end';
    export const MARGIN = 'margin';
    export const SOURCE = 'source';
    export const IS_IMPRECISE = 'isImprecise';
    export const IS_UNCERTAIN = 'isUncertain';
    export const LABEL = 'label';

    export const YEAR = 'year';
    export const INPUT_YEAR = 'inputYear';
    export const INPUT_TYPE = 'inputType';

    const VALID_FIELDS = [TYPE, BEGIN, END, MARGIN, SOURCE, IS_IMPRECISE, IS_UNCERTAIN, LABEL];
    const VALID_ELEMENT_FIELDS = [YEAR, INPUT_YEAR, INPUT_TYPE];
    export const VALID_DATING_TYPES = ['bce','ce','bp'];
    export const VALID_TYPES = ['range','single','before','after','scientific']

    export type Types = 'range'|'single'|'before'|'after'|'scientific'
    export type Translations = 'bce'|'ce'|'bp'|'before'|'after';


    export function isDating(dating: any): dating is Dating {

        if (!isObject(dating)) return false;

        for (const fieldName in dating) {
            if (!VALID_FIELDS.includes(fieldName)) return false;
        }
        if (dating.begin) for (const fieldName in dating.begin) {
            if (!VALID_ELEMENT_FIELDS.includes(fieldName)) return false;
        }
        if (dating.end) for (const fieldName in dating.end) {
            if (!VALID_ELEMENT_FIELDS.includes(fieldName)) return false;
        }
        if (dating.label) return true; // Support datings in deprecated format
        if (!dating.type || !['range', 'single', 'after', 'before', 'scientific'].includes(dating.type)) {
            return false;
        }
        return true;
    }


    export function isValid(dating: Dating) {

        if (dating.label) return true; // Support datings in deprecated format
        if (['range', 'after', 'scientific'].includes(dating.type) && !dating.begin) return false;
        if (['range', 'single', 'before', 'scientific'].includes(dating.type) && !dating.end) return false;
        if (dating.type === 'scientific' && !dating.margin) return false;

        if (dating.begin && (!dating.begin.inputYear || !dating.begin.inputType
            || !Number.isInteger(dating.begin.inputYear)
            || dating.begin.inputYear < 0)) return false;
        if (dating.end && (!dating.end.inputYear || !dating.end.inputType
            || !Number.isInteger(dating.end.inputYear)
            || dating.end.inputYear < 0)) return false;

        return dating.type !== 'range' || validateRangeDating(dating);
    }


    function validateRangeDating(dating: Dating): boolean {

        return dating.begin !== undefined && dating.end !== undefined &&
            Dating.getNormalizedYear(dating.begin.inputYear, dating.begin.inputType)
            <  Dating.getNormalizedYear(dating.end.inputYear, dating.end.inputType);
    }


    const dissocIfEmpty = (path: string) => cond(on(path, isUndefinedOrEmpty), detach(path)) as any;


    export function revert(dating: Dating): Dating {

        return flow(dating,
            detach(['begin','year']),
            detach(['end','year']),
            dissocIfEmpty('begin'),
            dissocIfEmpty('end')
         );
    }


    export function addNormalizedValues(dating: Dating) {

        setNormalizedYears(dating);
        if (dating.type === 'scientific') applyMargin(dating);
    }


    export function generateLabel(dating: Dating,
                                  getTranslation: (term: Dating.Translations) => string,
                                  getFromI18NString: (i18nString: I18N.String|string) => string): string {

        if (isValid(dating)) {
            let prefix = '';
            let year = '';
            let postfix = '';

            if (dating.type === 'range') {
                year = generateLabelForDate(dating.begin, getTranslation) + ' – '
                    + generateLabelForDate(dating.end, getTranslation);
            }
            if (dating.type === 'before' || dating.type == 'single') {
                year = generateLabelForDate(dating.end, getTranslation);
            }
            if (dating.type === 'after') year = generateLabelForDate(dating.begin, getTranslation);
            if (dating.type === 'scientific') {
                year = generateLabelForDate(dating.end, getTranslation);
                if (dating.margin && dating.margin > 0) year += ' ± ' + dating.margin;
            }

            if (dating.isImprecise) prefix = 'ca. ';
            if (dating.isUncertain) postfix = ' (?)';

            if (dating.type === 'before') prefix = getTranslation('before')  + ' ' + prefix;
            if (dating.type === 'after') prefix = getTranslation('after') + ' ' + prefix;

            if (dating.source) postfix += ' [' + getFromI18NString(dating.source) + ']';

            return prefix + year + postfix;
        } else {
            return JSON.stringify(dating);
        }
    }


    function generateLabelForDate(date: DatingElement|undefined,
                                  getTranslation: (term: Dating.Translations) => string): string {

        if (!date) {
            return '';
        } else if (date.inputYear === 0) {
            return '0';
        } else {
            return date.inputYear + ' ' + getTranslation(date.inputType);
        }
    }


    export function setNormalizedYears(dating: Dating) {

        if (dating.begin && dating.begin.inputYear && dating.begin.inputType) {
            dating.begin.year = getNormalizedYear(dating.begin.inputYear, dating.begin.inputType);
        }

        if (dating.end && dating.end.inputYear && dating.end.inputType) {
            dating.end.year = getNormalizedYear(dating.end.inputYear, dating.end.inputType);
        }
    }


    export function getNormalizedYear(inputYear: number, inputType: DatingType): number {

        if (inputType === 'bce') return 0 - inputYear;
        if (inputType === 'bp') return 1950 - inputYear;

        return inputYear;
    }


    function applyMargin(dating: Dating) {

        if (!dating.begin || !dating.end || !dating.margin) return;

        dating.begin.inputYear = dating.end.inputYear;
        dating.begin.year = dating.begin.year - dating.margin;
        dating.end.year = dating.end.year + dating.margin;
    }
}
