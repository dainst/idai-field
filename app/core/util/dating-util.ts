import {Dating, DatingElement, DatingType} from 'idai-components-2';
import {UtilTranslations} from './util-translations';


/**
 * @author Sebastian Cuy
 * @author Thomas Kleinke
 */
export module DatingUtil {

    export function addNormalizedValues(dating: Dating) {

        this.setNormalizedYears(dating);
        if (dating.type === 'scientific') this.applyMargin(dating);
    }


    export function generateLabel(dating: Dating, translations: UtilTranslations): string {

        let prefix = '';
        let year = '';
        let postfix = '';

        if (dating.type === 'range') {
            year = generateLabelForDate(dating.begin, translations) + ' – '
                + generateLabelForDate(dating.end, translations);
        }
        if (dating.type === 'before' || dating.type == 'exact') {
            year = generateLabelForDate(dating.end, translations);
        }
        if (dating.type === 'after') year = generateLabelForDate(dating.begin, translations);
        if (dating.type === 'scientific') {
            year = generateLabelForDate(dating.end, translations);
            if (dating.margin && dating.margin > 0) year += ' ± ' + dating.margin;
        }

        if (dating['isImprecise']) prefix = 'ca. ';
        if (dating['isUncertain']) postfix = ' (?)';

        if (dating.type === 'before') prefix = translations.getTranslation('before')  + ' ' + prefix;
        if (dating.type === 'after') prefix = translations.getTranslation('after') + ' ' + prefix;

        if (dating['source']) postfix += ' [' + dating['source'] + ']';

        return prefix + year + postfix;
    }


    function generateLabelForDate(date: DatingElement|undefined, translations: UtilTranslations): string {

        if (!date) {
            return '';
        } else if (date.inputYear === 0) {
            return '0';
        } else {
            return date.inputYear + ' ' + translations.getTranslation(date.inputType);
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


    function getNormalizedYear(inputYear: number, inputType: DatingType): number {

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