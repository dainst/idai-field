import {getSortedIds} from '../../../../../app/core/datastore/cached/get-sorted-ids';

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

        const result1 = getSortedIds(as as any, { q: 'C2',
            sort: 'default'
        });
        expect(result1).toEqual(['a', 'b', 'c']);

        const result2 = getSortedIds(as as any, { q: 'C2',
            sort: 'exactMatchFirst'
        });
        expect(result2).toEqual(['c', 'a', 'b']);
    });


    it('rankTypes', () => {

        const indexItems = [
            { id: 'c', identifier: '1', instances: { 'h': 'Terracotta', 'i': 'Terracotta' }  },
            { id: 'b', identifier: '2', instances: { 'f': 'Pottery', 'g': 'Terracotta' }  },
            { id: 'a', identifier: '3', instances: { 'd': 'Pottery', 'e': 'Pottery' } }
        ];

        const result1 = getSortedIds(indexItems as any,
            {
                types: ['Type'],
                rankOptions: { matchType: 'Pottery' }
            });
        expect(result1).toEqual(['a', 'b', 'c']);

        const result2 = getSortedIds(indexItems as any,
            {
                types: ['Type'],
                rankOptions: { matchType: 'Terracotta' }
            });
        expect(result2).toEqual(['c', 'b', 'a']);
    });
});
