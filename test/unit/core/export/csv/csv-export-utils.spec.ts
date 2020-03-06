import {CsvExportUtils} from '../../../../../app/core/export/csv/csv-export-utils';


/**
 * @author Daniel de Oliveira
 */
describe('CSVExportUtils', () => {

    it('getMax', () => {

        const result = CsvExportUtils
            .getMax(2)
            ([
                ['a', 'b', [{}, {}], 'e'],
                ['a', 'b', [{}, {}, {}]],
                ['a', 'c', [{}], 'd']
            ]);

        expect(result).toBe(3);
    });


    it('replaceItems', () => {

        const result = CsvExportUtils
            .replaceItems(1, 2, <A>(as: string[]) => ['e'])
            (['a', 'b', 'c', 'd']);

        expect(result).toEqual(['a', 'e', 'd'])
    });


    it('replaceItem', () => {

        const result = CsvExportUtils
            .replaceItem(1, (a: string) => [a, a + a])
            (['a','b','c']);

        expect(result).toEqual(['a', 'b', 'bb', 'c'])
    });
});