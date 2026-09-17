import { Comparator } from '../../src/services/comparator';


/**
 * @author Sebastian Cuy
 * @author Thomas Kleinke
 */
describe('Comparator', () => {

    it('sort strings alphanumerically', () => {

        const comparator = new Comparator('de');

        expect(comparator.alnumCompare('abc', 'abd')).toEqual(-1);
        expect(comparator.alnumCompare('abd', 'abc')).toEqual(1);
        expect(comparator.alnumCompare('abc', 'abc')).toEqual(0);

        expect(comparator.alnumCompare('1', '2')).toEqual(-1);
        expect(comparator.alnumCompare('2', '1')).toEqual(1);
        expect(comparator.alnumCompare('1', '1')).toEqual(0);

        expect(comparator.alnumCompare('2', '10')).toEqual(-1);
        expect(comparator.alnumCompare('10', '2')).toEqual(1);
        expect(comparator.alnumCompare('10', '10')).toEqual(0);

        expect(comparator.alnumCompare('item2', 'item10')).toEqual(-1);
        expect(comparator.alnumCompare('item10', 'item2')).toEqual(1);

        expect(comparator.alnumCompare('item', 'item1')).toEqual(-1);
        expect(comparator.alnumCompare('item1', 'item')).toEqual(1);

        expect(comparator.alnumCompare('item101', 'item10a')).toEqual(1);
        expect(comparator.alnumCompare('item10a', 'item101')).toEqual(-1);

        expect(comparator.alnumCompare('a1b2c3d4', 'asdfghjkl')).toEqual(-1);
        expect(comparator.alnumCompare('asdfghjkl', 'a1b2c3d4')).toEqual(1);
    });


    it('sort numbers', () => {

        const comparator = new Comparator('de');

        expect(comparator.numberCompare(1, 2)).toEqual(-1);
        expect(comparator.numberCompare(2, 2)).toEqual(0);
        expect(comparator.numberCompare(2, 1)).toEqual(1);
    })
});
