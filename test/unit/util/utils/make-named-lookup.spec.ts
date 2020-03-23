import {makeNamedLookup} from '../../../../app/core/util/utils';

describe('makeNamedLookup', () => {

    it('makeNamedLookup', () => {

        const namedAs =  [{ name: '17', e: 3 }, { name: '19', e: 7 }];

        expect(
            makeNamedLookup(namedAs)
        ).toEqual(
            {
                '17': {e: 3, name: '17'},
                '19': {e: 7, name: '19'}
            }
        );
    });
});