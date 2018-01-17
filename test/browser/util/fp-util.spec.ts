import {FPUtil} from "../../../app/util/fp-util";

/**
 * @author Daniel de Oliveira
 */
export function main() {

    describe('FPUtil', () => {

        it('take five',() => {

            expect(FPUtil.takeWhile([7,9,10,13,17,20],
                (el: number) => el < 20)).toEqual([7, 9, 10, 13, 17]);
        });


        it('take none',() => {

            expect(FPUtil.takeWhile([7,9,10,13,17,20],
                (el: number) => el > 23)).toEqual([]);
        });


        it('take all',() => {

            expect(FPUtil.takeWhile([7,9],
                (el: number) => el > 1)).toEqual([7, 9]);
        });


        it('empty',() => {

            expect(FPUtil.takeWhile([],
                (el: number) => el > 23)).toEqual([]);
        });



        it('until: take two',() => {

            expect(FPUtil.takeUntil([7,9,11],
                (el: number) => el > 7)).toEqual([7, 9]);
        });


        it('until: take all',() => {

            expect(FPUtil.takeUntil([7,9,11],
                (el: number) => el > 13)).toEqual([7, 9, 11]);
        });


        it('until: empty',() => {

            expect(FPUtil.takeUntil([],
                (el: number) => el > 13)).toEqual([]);
        });
    });
}