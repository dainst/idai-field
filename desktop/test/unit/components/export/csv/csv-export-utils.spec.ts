import { describe, expect, test } from '@jest/globals';
import { val } from 'tsfun';
import { CsvExportUtils } from '../../../../../src/app/components/export/csv/csv-export-utils';


/**
 * @author Daniel de Oliveira
 */
describe('CSVExportUtils', () => {

    test('getMax', () => {

        const result = CsvExportUtils
            .getMax(2)
            ([
                ['a', 'b', [{}, {}], 'e'],
                ['a', 'b', [{}, {}, {}]],
                ['a', 'c', [{}], 'd']
            ]);

        expect(result).toBe(3);
    });


    test('replaceItems', () => {

        const result = CsvExportUtils
            .replaceItems(1, 2, val(['e']))
            (['a', 'b', 'c', 'd']);

        expect(result).toEqual(['a', 'e', 'd'])
    });


    test('replaceItem', () => {

        const result = CsvExportUtils
            .replaceItem(1, val(['e', 'f']))
            (['a','b','c']);

        expect(result).toEqual(['a', 'e', 'f', 'c'])
    });
});
