import { getSortedIds } from '../../src/index/get-sorted-ids';


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
            sort: { mode: 'default' }
        }, ['Type']);
        expect(result1).toEqual(['a', 'b', 'c']);

        const result2 = getSortedIds(as as any, {
            q: 'C2',
            sort: { mode: 'exactMatchFirst' }
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
});
