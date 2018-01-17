import {FPUtil} from "../../../app/util/fp-util";

/**
 * @author Daniel de Oliveira
 */
export function main() {

    describe('_', () => {

        it('take five', () =>

            expect(FPUtil.takeWhile(
                (_: number) => _ < 20)([7, 9, 10, 13, 17, 20])).toEqual([7, 9, 10, 13, 17])
        );


        it('take none', () =>

            expect(FPUtil.takeWhile(
                (_: number) => _ > 23)([7, 9, 10, 13, 17, 20])).toEqual([])
        );


        it('take all', () =>

            expect(FPUtil.takeWhile(
                (_: number) => _ > 1)([7, 9])).toEqual([7, 9])
        );


        it('empty', () =>

            expect(FPUtil.takeWhile(
                (_: number) => _ > 23)([])).toEqual([])
        );


        it('until: take two', () => {

            expect(FPUtil.takeUntil(
                (_: number) => _ > 7)([7, 9, 11])).toEqual([7, 9]);
        });


        it('until: take all', () =>

            expect(FPUtil.takeUntil(
                (_: number) => _ > 13)([7, 9, 11])).toEqual([7, 9, 11])
        );


        it('until: empty', () =>

            expect(FPUtil.takeUntil(
                (_: number) => _ > 13)([])).toEqual([])
        );
    });
}