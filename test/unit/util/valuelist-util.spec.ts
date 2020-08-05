import {ValuelistUtil} from '../../../src/app/core/util/valuelist-util';
import {ValuelistDefinition} from '../../../src/app/core/configuration/model/valuelist-definition';


/**
 * @author Thomas Kleinke
 */

describe('ValuelistUtil', () => {

    it('sort values alphabetically', () => {

        const valuelist: ValuelistDefinition = {
            values: {
                '1': { labels: { de: 'D' } },
                '2': { labels: { de: 'A' } },
                '3': { labels: { de: 'C' } },
                '4': { labels: { de: 'B' } },
            }
        };

        expect(ValuelistUtil.getOrderedValues(valuelist)).toEqual(['2', '4', '3', '1'])
    });


    it('sort values by custom order', () => {

        const valuelist: ValuelistDefinition = {
            values: {
                '1': { labels: { de: 'A' } },
                '2': { labels: { de: 'B' } },
                '3': { labels: { de: 'C' } },
                '4': { labels: { de: 'D' } },
            },
            order: ['2', '4', '3', '1']
        };

        expect(ValuelistUtil.getOrderedValues(valuelist)).toEqual(['2', '4', '3', '1'])
    });
});
