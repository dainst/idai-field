import {
    bigger,
    differentFrom,
    dropWhile,
    filter,
    flow,
    includedIn,
    intersect,
    map,
    reverse,
    smaller,
    subtract,
    subtractArrays,
    takeWhile,
    times,
    unite,
    uniteWith
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


        it('intersect',() =>

            expect(

                flow(
                    intersect,
                    map(times(2))
                )([[1,2],[2,3]])

            ).toEqual([4])
        );


        it('uniteWith',() =>

            expect(

                flow(
                    uniteWith([1,2]),
                    map(times(2))
                )([2,4])

            ).toEqual([2,4,8])
        );


        it('unite',() =>

            expect(
                flow(
                    unite,
                    map(times(2))
                )([[1,2],[3,4],[2,4]])

            ).toEqual([2,4,6,8])
        );


        it('subtract',() =>

            expect(

                flow(
                    subtract([3,4,5]),
                    filter(smaller(2))
                )([1,2,3])

            ).toEqual([1])
        );


        it('subtractArrays',() =>

            expect(

                flow(
                    subtractArrays([[1,2],[2,2]]),
                    filter(bigger(3))
                )([1,2,3,4])

            ).toEqual([4])
        );


        it('reverse', () =>

            expect(

                flow(
                    reverse
                )([1,3])

            ).toEqual(([3,1]))
        );


        it('dropWhile', () =>

            expect(

                flow(
                    dropWhile(smaller(20)),
                    reverse
                )
                ([7, 9, 10, 13, 21, 20])

            ).toEqual([20, 21])
        );
    });
}