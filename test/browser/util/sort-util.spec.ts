import {SortUtil} from "../../../app/util/sort-util";

/**
 * @author Daniel de Oliveira
 */
export function main() {

    fdescribe('SortUtil', () => {

        it('should sort strings alphanumerically', () => {

            expect(SortUtil.alnumCompare('abc','abd')).toEqual(-1);
            expect(SortUtil.alnumCompare('abd','abc')).toEqual(1);
            expect(SortUtil.alnumCompare('abc','abc')).toEqual(0);

            expect(SortUtil.alnumCompare('1','2')).toEqual(-1);
            expect(SortUtil.alnumCompare('2','1')).toEqual(1);
            expect(SortUtil.alnumCompare('1','1')).toEqual(0);

            expect(SortUtil.alnumCompare('2','10')).toEqual(-1);
            expect(SortUtil.alnumCompare('10','2')).toEqual(1);
            expect(SortUtil.alnumCompare('10','10')).toEqual(0);

            expect(SortUtil.alnumCompare('item2','item10')).toEqual(-1);
            expect(SortUtil.alnumCompare('item10','item2')).toEqual(1);

            expect(SortUtil.alnumCompare('item','item1')).toEqual(-1);
            expect(SortUtil.alnumCompare('item1','item')).toEqual(1);

            expect(SortUtil.alnumCompare('item101','item10a')).toEqual(1);
            expect(SortUtil.alnumCompare('item10a','item101')).toEqual(-1);

            expect(SortUtil.alnumCompare('a1b2c3d4','asdfghjkl')).toEqual(-1);
            expect(SortUtil.alnumCompare('asdfghjkl','a1b2c3d4')).toEqual(1);
        });

        it('should sort strings alphabetically', () => {

            expect(SortUtil.compare('abc','abd')).toEqual(-1);
            expect(SortUtil.compare('abd','abc')).toEqual(1);
            expect(SortUtil.compare('abc','abc')).toEqual(0);
        });

        it('should sort strings alphabetically and descending', () => {

            let comp = SortUtil.compareDescending(SortUtil.compare);
            expect(comp('abc','abd')).toEqual(1);
            expect(comp('abd','abc')).toEqual(-1);
            expect(comp('abc','abc')).toBe(0); // "toBe" necessary since -0 does not equal 0
        });

    });
}