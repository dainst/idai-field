import {AlnumSortUtil} from "../../../app/util/alnum-sort-util";

/**
 * @author Daniel de Oliveira
 */
export function main() {

    fdescribe('AlnumSortUtil', () => {

        it('should sort strings without numbers as usual', () => {

            expect(AlnumSortUtil.compare('abc','abd')).toEqual(-1);
            expect(AlnumSortUtil.compare('abd','abc')).toEqual(1);
            expect(AlnumSortUtil.compare('abc','abc')).toEqual(0);
        });

        it('should sort strings with only numbers numerically', () => {

            expect(AlnumSortUtil.compare('1','2')).toEqual(-1);
            expect(AlnumSortUtil.compare('2','1')).toEqual(1);
            expect(AlnumSortUtil.compare('1','1')).toEqual(0);

            expect(AlnumSortUtil.compare('2','10')).toEqual(-1);
            expect(AlnumSortUtil.compare('10','2')).toEqual(1);
            expect(AlnumSortUtil.compare('10','10')).toEqual(0);
        });

        it('should sort mixed strings alphanumerically', () => {

            expect(AlnumSortUtil.compare('item2','item10')).toEqual(-1);
            expect(AlnumSortUtil.compare('item10','item2')).toEqual(1);

            expect(AlnumSortUtil.compare('item','item1')).toEqual(-1);
            expect(AlnumSortUtil.compare('item1','item')).toEqual(1);

            expect(AlnumSortUtil.compare('item101','item10a')).toEqual(1);
            expect(AlnumSortUtil.compare('item10a','item101')).toEqual(-1);

            expect(AlnumSortUtil.compare('a1b2c3d4','asdfghjkl')).toEqual(-1);
            expect(AlnumSortUtil.compare('asdfghjkl','a1b2c3d4')).toEqual(1);
        });

    });
}