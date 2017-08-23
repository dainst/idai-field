import {SortUtil} from "../../../app/util/sort-util";

/**
 * @author Daniel de Oliveira
 */
export function main() {

    describe('SortUtil', () => {

        it('should sort strings alphanumerically', () => {

            expect(SortUtil.compare('abc','abd')).toEqual(-1);
            expect(SortUtil.compare('abd','abc')).toEqual(1);
            expect(SortUtil.compare('abc','abc')).toEqual(0);

            expect(SortUtil.compare('1','2')).toEqual(-1);
            expect(SortUtil.compare('2','1')).toEqual(1);
            expect(SortUtil.compare('1','1')).toEqual(0);

            expect(SortUtil.compare('2','10')).toEqual(-1);
            expect(SortUtil.compare('10','2')).toEqual(1);
            expect(SortUtil.compare('10','10')).toEqual(0);

            expect(SortUtil.compare('item2','item10')).toEqual(-1);
            expect(SortUtil.compare('item10','item2')).toEqual(1);

            expect(SortUtil.compare('item','item1')).toEqual(-1);
            expect(SortUtil.compare('item1','item')).toEqual(1);

            expect(SortUtil.compare('item101','item10a')).toEqual(1);
            expect(SortUtil.compare('item10a','item101')).toEqual(-1);

            expect(SortUtil.compare('a1b2c3d4','asdfghjkl')).toEqual(-1);
            expect(SortUtil.compare('asdfghjkl','a1b2c3d4')).toEqual(1);
        });

    });
}