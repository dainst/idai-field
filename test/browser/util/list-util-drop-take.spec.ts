import {
    bigger,
    dropWhile,
    smaller,
    takeRightWhile,
    takeUntil,
    takeWhile
} from '../../../app/util/list-util';

/**
 * @author Daniel de Oliveira
 */
export function main() {

    describe('ListUtil', () => {

        it('takeWhile - take five', () =>

            expect(

                takeWhile(smaller(20))
                    ([7, 9, 10, 13, 17, 20])

            ).toEqual([7, 9, 10, 13, 17])
        );


        it('takeWhile - take none', () =>

            expect(

                takeWhile(bigger(23))
                    ([7, 9, 10, 13, 17, 20])

            ).toEqual([])
        );


        it('takeWhile - take all', () =>

            expect(

                takeWhile(bigger(1))
                ([7, 9])

            ).toEqual([7, 9])
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

            expect(

                takeUntil(bigger(7))
                    ([7, 9, 11])

            ).toEqual([7, 9]);
        });


        it('takeUntil - take all', () =>

            expect(

                takeUntil(bigger(13))
                    ([7, 9, 11])

            ).toEqual([7, 9, 11])
        );


        it('takeUntil - empty', () =>

            expect(

                takeUntil(bigger(13))
                    ([])

            ).toEqual([])
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
    });
}