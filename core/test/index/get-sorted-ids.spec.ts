import { getSortedIds } from '../../src/index/get-sorted-ids';
import { SortMode } from '../../src/model/datastore/query';


/**
 * @author Daniel de Oliveira
 */
describe('getSortedIds', () => {

    it('exactMatchFirst', () => {

        const as = [
            { id: 'a', identifier: 'AB-C1' },
            { id: 'b', identifier: 'AB-C2' },
            { id: 'c', identifier: 'C2' }
        ];

        const result1 = getSortedIds(as as any, {
            q: 'C2',
            sort: { mode: SortMode.Alphanumeric }
        }, ['Type']);
        expect(result1).toEqual(['a', 'b', 'c']);

        const result2 = getSortedIds(as as any, {
            q: 'C2',
            sort: { mode: SortMode.ExactMatchFirst }
        }, ['Type']);
        expect(result2).toEqual(['c', 'a', 'b']);
    });


    it('rankCategories', () => {

        const indexItems = [
            { id: 'c', identifier: '1', instances: { 'h': 'Terracotta', 'i': 'Terracotta' }  },
            { id: 'b', identifier: '2', instances: { 'f': 'Pottery', 'g': 'Terracotta' }  },
            { id: 'a', identifier: '3', instances: { 'd': 'Pottery', 'e': 'Pottery' } }
        ];

        const result1 = getSortedIds(indexItems as any,
            {
                categories: ['Type'],
                sort: { matchCategory: 'Pottery' }
            },
            ['Type']
        );
        expect(result1).toEqual(['a', 'b', 'c']);

        const result2 = getSortedIds(indexItems as any,
            {
                categories: ['Type'],
                sort: { matchCategory: 'Terracotta' }
            },
            ['Type']
        );
        expect(result2).toEqual(['c', 'b', 'a']);
    });


    it('rankCategories - sort by category, then by count', () => {

        const indexItems = [
            { id: 'b', identifier: '1', instances: { 'c': 'Terracotta'}  },
            { id: 'a', identifier: '2', instances: { 'e': 'Terracotta', 'd': 'Terracotta'  }  },
        ];

        const result1 = getSortedIds(indexItems as any,
            {
                categories: ['Type'],
                sort: { matchCategory: 'Terracotta' }
            },
            ['Type']
        );
        expect(result1).toEqual(['a', 'b']);
    });


    it('sort alphanumerically ascending', () => {

        const indexItems = [
            { id: 'a', identifier: 'A1' },
            { id: 'b', identifier: 'B1' },
            { id: 'c', identifier: 'A11' },
            { id: 'd', identifier: 'A2' }
        ];

        const result1 = getSortedIds(indexItems as any, {
            q: '',
            sort: { mode: SortMode.Alphanumeric }
        }, []);
        expect(result1).toEqual(['a', 'd', 'c', 'b']);
    });


    it('sort alphanumerically descending', () => {

        const indexItems = [
            { id: 'a', identifier: 'A1' },
            { id: 'b', identifier: 'B1' },
            { id: 'c', identifier: 'A11' },
            { id: 'd', identifier: 'A2' }
        ];

        const result1 = getSortedIds(indexItems as any, {
            q: '',
            sort: { mode: SortMode.AlphanumericDescending }
        }, []);
        expect(result1).toEqual(['b', 'c', 'd', 'a']);
    });


    it('sort by date ascending', () => {

        const indexItems = [
            { id: 'a', identifier: 'A', date: 1751038414531 },
            { id: 'b', identifier: 'B', date: 1751038414534 },
            { id: 'c', identifier: 'C', date: 1751038414533 },
            { id: 'd', identifier: 'D', date: 1751038414532 }
        ];

        const result1 = getSortedIds(indexItems as any, {
            q: '',
            sort: { mode: SortMode.Date }
        }, []);
        expect(result1).toEqual(['a', 'd', 'c', 'b']);
    });


    it('sort by date descending', () => {

        const indexItems = [
            { id: 'a', identifier: 'A', date: 1751038414531 },
            { id: 'b', identifier: 'B', date: 1751038414534 },
            { id: 'c', identifier: 'C', date: 1751038414533 },
            { id: 'd', identifier: 'D', date: 1751038414532 }
        ];

        const result1 = getSortedIds(indexItems as any, {
            q: '',
            sort: { mode: SortMode.DateDescending }
        }, []);
        expect(result1).toEqual(['b', 'c', 'd', 'a']);
    });


    it('sort alphanumerically if date is identical in sort mode "date ascending"', () => {

        const indexItems = [
            { id: 'd', identifier: 'D', date: 1751038414531 },
            { id: 'c', identifier: 'C', date: 1751038414532 },
            { id: 'b', identifier: 'B', date: 1751038414532 },
            { id: 'a', identifier: 'A', date: 1751038414533 }
        ];

        const result1 = getSortedIds(indexItems as any, {
            q: '',
            sort: { mode: SortMode.Date }
        }, []);
        expect(result1).toEqual(['d', 'b', 'c', 'a']);
    });


    it('sort alphanumerically if date is identical in sort mode "descending"', () => {

        const indexItems = [
            { id: 'd', identifier: 'D', date: 1751038414531 },
            { id: 'c', identifier: 'C', date: 1751038414532 },
            { id: 'b', identifier: 'B', date: 1751038414532 },
            { id: 'a', identifier: 'A', date: 1751038414533 }
        ];

        const result1 = getSortedIds(indexItems as any, {
            q: '',
            sort: { mode: SortMode.DateDescending }
        }, []);
        expect(result1).toEqual(['a', 'b', 'c', 'd']);
    });
});
