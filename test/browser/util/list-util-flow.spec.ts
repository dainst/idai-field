import {
    bigger,
    differentFrom,
    dropWhile,
    filter,
    flow,
    includedIn,
    intersection,
    map,
    reverse,
    smaller,
    subtract,
    takeRightWhile,
    takeWhile,
    times,
    union,
    unite
} from '../../../app/util/list-util';

/**
 * @author Daniel de Oliveira
 */
export function main() {

    describe('ListUtil/Flow -- ', () => {

        it('flow', () =>

            expect(flow(
                takeWhile(bigger(4)),
                map(times(2)),
                filter(smaller(16)),
                filter(differentFrom(12)),
                filter(includedIn([14]))
            )
            ([5,6,7,8,4,16,5])).toEqual([14])
        );


        it('map', () =>

            expect(

                map(times(2))
                ([2, 4])

            ).toEqual(([4, 8]))
        );


        it('filter', () =>

            expect(

                filter(smaller(4))
                    ([2, 4, 1, 5, 7, 8, 2, 1, 0])

            ).toEqual(([2, 1, 2, 1, 0]))
        );


        it('reverse ', () =>

            expect(

                reverse([1, 3])

            ).toEqual(([3, 1]))
        );


        it('intersect',() =>

            expect(

                flow(
                    intersection,
                    map(times(2))
                )([[1,2],[2,3]])

            ).toEqual([4])
        );


        it('uniteWith',() =>

            expect(

                flow(
                    unite([1,2]),
                    map(times(2))
                )([2,4])

            ).toEqual([2,4,8])
        );


        it('unite',() =>

            expect(
                flow(
                    union,
                    map(times(2))
                )([[1,2],[3,4],[2,4]])

            ).toEqual([2,4,6,8])
        );


        it('subtract',() =>

            expect(

                flow(
                    subtract([3, 4, 5]),
                    filter(smaller(2))
                )([1, 2, 3])

            ).toEqual([1])
        );


        it('reverse', () =>

            expect(

                flow(
                    reverse
                )([1,3])

            ).toEqual(([3,1]))
        );


        it('takeWhile', () =>

            expect(

                flow(
                    takeWhile(smaller(20)),
                    filter(bigger(13))
                )([13, 17, 20])

            ).toEqual([17])
        );


        it('takeRightWhile', () =>

            expect(

                flow(
                    takeRightWhile(bigger(20)),
                    filter(bigger(21))
                )([13, 22, 21])

            ).toEqual([22])
        );


        it('dropWhile', () =>

            expect(

                flow(
                    dropWhile(smaller(20)),
                    reverse
                )([7, 9, 10, 13, 21, 20])

            ).toEqual([20, 21])
        );
    });
}