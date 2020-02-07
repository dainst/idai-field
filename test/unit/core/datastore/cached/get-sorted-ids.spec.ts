import {getSortedIds} from '../../../../../app/core/datastore/cached/get-sorted-ids';

/**
 * @author Daniel de Oliveira
 */
describe('getSortedIds', () => {

    it('base', () => {

        const as = [{ id: 'a', identifier: '1.a' }, { id: 'b', identifier: '1' }];

        const result = getSortedIds(as as any, { q: '1',
            sort: 'default' // <- TODO why would we need exactMatchFirst? alnumCompare seems to do the trick here, right?
        });
        expect(result).toEqual(['b', 'a'])
    });
});
