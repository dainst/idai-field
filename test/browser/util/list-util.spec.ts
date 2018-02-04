import {
    bigger,
    dropWhile,
    filter,
    intersect,
    intersectWith,
    map,
    removeFrom,
    reverse,
    smaller,
    subtract,
    subtractNested,
    takeUntil,
    takeWhile,
    times,
    unite,
    uniteWith,
    takeRightWhile,
} from '../../../app/util/list-util';

/**
 * @author Daniel de Oliveira
 */
export function main() {

    describe('ListUtil', () => {

        it('intersectWith',() =>

            expect(

                intersectWith([1,2])([2,4])

            ).toEqual([2])
        );


        it('intersect',() =>

            expect(

                intersect([[1,2],[2,3],[2,4]])

            ).toEqual([2])
        );


        it('intersect - no intersection',() =>

            expect(

                intersect([[1,2],[3,4],[5,6]])

            ).toEqual([])
        );


        it('intersect - no intersection where only partial intersection',() =>

            expect(

                intersect([[1,2],[2,3],[3,4]])

            ).toEqual([])
        );


        it('uniteWith',() =>

            expect(

                uniteWith([1, 2])([2, 4])

            ).toEqual([1, 2, 4])
        );


        it('unite ',() =>

            expect(

                unite([[1, 2],[3, 4],[2, 4]])

            ).toEqual([1, 2, 3, 4])
        );


        it('subtract', () =>

            expect(

                subtract([3, 4, 5])([1, 2, 3])

            ).toEqual([1, 2])
        );


        it('subtract - from empty list', () =>

            expect(

                subtract([3, 4, 5])([])

            ).toEqual([])
        );


        it('subtract - empty list', () => {

            expect(

                subtract([])([1, 2, 3])

            ).toEqual([1, 2, 3]);
        });


        it('subtract - no intersection', () =>

            expect(

                subtract([4, 5, 6])([1, 2, 3])

            ).toEqual([1, 2, 3])
        );


        it('subtract - multiple',() =>

            expect(

                subtract([1, 2], [2, 2])([1, 2, 3, 4])

            ).toEqual([3, 4])
        );


        it('subtractNested',() =>

            expect(

                subtractNested([[1, 2], [2, 2]])([1, 2, 3, 4])

            ).toEqual([3, 4])
        );


        it('takeWhile - take five', () =>

            expect(takeWhile(smaller(20))
                ([7, 9, 10, 13, 17, 20])).toEqual([7, 9, 10, 13, 17])
        );


        it('takeWhile - take none', () =>

            expect(takeWhile(bigger(23))
                ([7, 9, 10, 13, 17, 20])).toEqual([])
        );


        it('takeWhile - take all', () =>

            expect(takeWhile(bigger(1))
                ([7, 9])).toEqual([7, 9])
        );


        it('takeWhile - empty', () =>

            expect(takeWhile(bigger(23))
                ([])).toEqual([])
        );


        it('takeRightWhile - take five', () =>

            expect(

                takeRightWhile(bigger(13))
                    ([7, 9, 10, 13, 17, 20])

            ).toEqual([17, 20])
        );


        it('takeRightWhile - take none', () =>

            expect(

                takeRightWhile(bigger(23))
                    ([7, 9, 10, 13, 17, 20])

            ).toEqual([])
        );


        it('takeRightWhile - take all', () =>

            expect(

                takeRightWhile(bigger(1))
                    ([7, 9])

            ).toEqual([7, 9])
        );


        it('takeRightWhile - empty', () =>

            expect(

                takeRightWhile(bigger(23))
                    ([])

            ).toEqual([])
        );


        it('takeUntil - take two', () => {

            expect(takeUntil(bigger(7))
                ([7, 9, 11])).toEqual([7, 9]);
        });


        it('takeUntil - take all', () =>

            expect(takeUntil(bigger(13))
                ([7, 9, 11])).toEqual([7, 9, 11])
        );


        it('takeUntil - empty', () =>

            expect(takeUntil(bigger(13))
                ([])).toEqual([])
        );


        it('dropWhile - drop five', () =>

            expect(

                dropWhile(smaller(20))
                    ([7, 9, 10, 13, 21, 20])

            ).toEqual([21, 20])
        );


        it('dropWhile - drop none', () =>

            expect(

                dropWhile(smaller(5))
                    ([7, 9, 10, 13, 21, 20])

            ).toEqual([7, 9, 10, 13, 21, 20])
        );


        it('dropWhile - empty', () =>

            expect(

                dropWhile(smaller(20))
                    ([])

            ).toEqual([])
        );


        it('removeFrom', () =>

            expect(removeFrom([1,2,13,13,4])(13)).toEqual([1,2,4])
        );


        it('removeFrom - nothing', () =>

            expect(removeFrom([1,2,7,4])(13)).toEqual([1,2,7,4])
        );


        it('removeFrom - everything', () =>

            expect(removeFrom([1,1])(1)).toEqual([])
        );


        it('times', () =>

            expect(times(2)
                (2)).toEqual(4)
        );


        it('map', () =>

            expect(map(times(2))
                ([2,4])).toEqual(([4,8]))
        );


        it('filter', () =>

            expect(filter(smaller(4))
                ([2,4,1,5,7,8,2,1,0])).toEqual(([2,1,2,1,0]))
        );


        it('reverse ', () =>

            expect(reverse([1,3])).toEqual(([3,1]))
        );
    });
}