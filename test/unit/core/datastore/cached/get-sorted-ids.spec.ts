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
});
