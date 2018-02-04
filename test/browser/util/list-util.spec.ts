import {
    intersect,
    intersectWith,
    removeFrom,
    subtract,
    subtractNested,
    times,
    unite,
    uniteWith
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


        it('removeFrom', () =>

            expect(

                removeFrom([1, 2, 13, 13, 4])
                    (13)

            ).toEqual([1, 2, 4])
        );


        it('removeFrom - nothing', () =>

            expect(

                removeFrom([1, 2, 7, 4])
                    (13)

            ).toEqual([1, 2, 7, 4])
        );


        it('removeFrom - everything', () =>

            expect(

                removeFrom([1, 1])
                    (1)

            ).toEqual([])
        );


        it('times', () =>

            expect(

                times(2)
                    (2)

            ).toEqual(4)
        );
    });
}