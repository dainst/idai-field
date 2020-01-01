import {flow, dissocOn, cond, on, isEmpty, dissoc} from 'tsfun';
import {Dating, DatingElement, DatingType} from 'idai-components-2';


/**
 * @author Sebastian Cuy
 * @author Thomas Kleinke
 */
export module DatingUtil { // TODO move to dating.ts

    export function isValid(dating: Dating): boolean {

        if (dating.label) return true;
        if (!dating.type || !['range', 'exact', 'after', 'before', 'scientific'].includes(dating.type)) {
            return false;
        }
        if (['range', 'after', 'scientific'].includes(dating.type) && !dating.begin) return false;
        if (['range', 'exact', 'before', 'scientific'].includes(dating.type) && !dating.end) return false;
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
            DatingUtil.getNormalizedYear(dating.begin.inputYear, dating.begin.inputType)
            <  DatingUtil.getNormalizedYear(dating.end.inputYear, dating.end.inputType);
    }


    const dissocIfEmpty = (path: string) => cond(on(path, isEmpty), dissoc(path));

    /**
     * @param dating
     *
     * @author Daniel de Oliveira
     */
    export function revert(dating: Dating): Dating {

        return flow(dating,
            dissocOn('begin.year'),
            dissocOn('end.year'),
            dissocIfEmpty('begin'),
            dissocIfEmpty('end'));
    }


    export function addNormalizedValues(dating: Dating) {

        setNormalizedYears(dating);
        if (dating.type === 'scientific') applyMargin(dating);
    }


    export function generateLabel(dating: Dating,
                                  getTranslation: (key: string) => string): string {

        let prefix = '';
        let year = '';
        let postfix = '';

        if (dating.type === 'range') {
            year = generateLabelForDate(dating.begin, getTranslation) + ' – '
                + generateLabelForDate(dating.end, getTranslation);
        }
        if (dating.type === 'before' || dating.type == 'exact') {
            year = generateLabelForDate(dating.end, getTranslation);
        }
        if (dating.type === 'after') year = generateLabelForDate(dating.begin, getTranslation);
        if (dating.type === 'scientific') {
            year = generateLabelForDate(dating.end, getTranslation);
            if (dating.margin && dating.margin > 0) year += ' ± ' + dating.margin;
        }

        if (dating['isImprecise']) prefix = 'ca. ';
        if (dating['isUncertain']) postfix = ' (?)';

        if (dating.type === 'before') prefix = getTranslation('before')  + ' ' + prefix;
        if (dating.type === 'after') prefix = getTranslation('after') + ' ' + prefix;

        if (dating['source']) postfix += ' [' + dating['source'] + ']';

        return prefix + year + postfix;
    }


    function generateLabelForDate(date: DatingElement|undefined,
                                  getTranslation: (key: string) => string): string {

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
        dating.begin.year = dating.begin.inputYear - dating.margin;
        dating.end.year = dating.end.inputYear + dating.margin;
    }
}