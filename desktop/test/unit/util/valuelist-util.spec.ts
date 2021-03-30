import {ValuelistUtil} from '../../../src/app/core/util/valuelist-util';
import {ValuelistDefinition} from 'idai-field-core';


/**
 * @author Thomas Kleinke
 */

describe('ValuelistUtil', () => {

    it('sort values alphanumerically', () => {

        const valuelist: ValuelistDefinition = {
            values: {
                '1': { labels: { de: 'B300' } },
                '2': { labels: { de: 'A3' } },
                '3': { labels: { de: 'B3' } },
                '4': { labels: { de: 'A300' } }
            },
            id: '1'
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
            order: ['2', '4', '3', '1'],
            id: '1'
        };

        expect(ValuelistUtil.getOrderedValues(valuelist)).toEqual(['2', '4', '3', '1'])
    });
});
