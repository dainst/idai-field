import { replaceIn } from '../../../src/tools/utils';


describe('replaceIn', () => {

    it('object', () => {

        expect(
            replaceIn({})([['d', 'e'], ['f', 'g']])
        ).toEqual({ d: 'e', f: 'g'});
    });


    it('array', () => {

        expect(
            replaceIn(['a', 'b', 'c', 'd'])([[1, 'e'], [2, 'g']])
        ).toEqual(['a', 'e', 'g', 'd']);
    });
});
