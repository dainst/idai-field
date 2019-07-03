import {Dating} from '../../components/docedit/core/forms/dating.component';


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


    function generateLabelForDate(date: any): string {

        if (date.year === 0) {
            return '0';
        } else {
            return date.year + ' ' + DATE_TYPES[date.type];
        }
    }
}