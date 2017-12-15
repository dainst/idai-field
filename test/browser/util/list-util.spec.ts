import {ListUtil, NestedArray} from '../../../app/util/list-util';

/**
 * @author Daniel de Oliveira
 */
export function main() {

    describe('ListUtil', () => {

        it('intersect - intersection',() => {

            expect(ListUtil.intersect([[1,2],[2,3],[2,4]])).toEqual([2]);
        });


        it('intersect - no intersection',() => {

            expect(ListUtil.intersect([[1,2],[3,4],[5,6]])).toEqual([]);
        });


        it('intersect - no intersection where only partial intersection',() => {

            expect(ListUtil.intersect([[1,2],[2,3],[3,4]])).toEqual([]);
        });


        it('subtractTwo',() => {

            expect(ListUtil.subtractTwo([[1,2],[2,2]],[1,2,3,4])).toEqual([3,4]);
        });
    });
}