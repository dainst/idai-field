import {Dating, DatingElement} from 'idai-components-2';


/**
 * @author Sebastian Cuy
 * @author Thomas Kleinke
 */
export module DatingUtil {

    const DATE_TYPES: { [dateType: string]: string } = {
        'bce': 'v.Chr.',
        'ce': 'n.Chr.',
        'bp': 'BP'
    };


    export function addNormalizedValues(dating: Dating) {

        this.setNormalizedYears(dating);
        if (dating.type === 'scientific') this.applyMargin(dating);
    }


    export function generateLabel(dating: Dating): string {

        let prefix = '';
        let year = '';
        let postfix = '';

        if (dating.type === 'range') {
            year = generateLabelForDate(dating.begin) + ' – ' + generateLabelForDate(dating.end);
        }
        if (dating.type === 'before' || dating.type == 'exact') year = generateLabelForDate(dating.end);
        if (dating.type === 'after') year = generateLabelForDate(dating.begin);
        if (dating.type === 'scientific') {
            year = generateLabelForDate(dating.end);
            if (dating.margin && dating.margin > 0) year += ' ± ' + dating.margin;
        }

        if (dating['isImprecise']) prefix = 'ca. ';
        if (dating['isUncertain']) postfix = ' (?)';

        if (dating.type === 'before') prefix = 'Vor ' + prefix;
        if (dating.type === 'after') prefix = 'Nach ' + prefix;

        if (dating['source']) postfix += ' [' + dating['source'] + ']';

        return prefix + year + postfix;
    }


    function generateLabelForDate(date: DatingElement|undefined): string {

        if (!date) {
            return '';
        } else if (date.inputYear === 0) {
            return '0';
        } else {
            return date.inputYear + ' ' + DATE_TYPES[date.inputType];
        }
    }


    function setNormalizedYears(dating: Dating) {

        if (dating.begin && dating.begin.inputYear && dating.begin.inputType) {
            dating.begin.year = getNormalizedYear(dating.begin.inputYear, dating.begin.inputType);
        }

        if (dating.end && dating.end.inputYear && dating.end.inputType) {
            dating.end.year = getNormalizedYear(dating.end.inputYear, dating.end.inputType);
        }
    }


    function getNormalizedYear(inputYear: number, inputType: 'bce'|'ce'|'bp'): number {

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