import {equal, reverse} from 'tsfun';
import {
    flattenTreelist,
    mapLeafs,
    mapTreelist,
    Treelist
} from '../../../../src/app/core/configuration/treelist';


describe('Treelist', () => {

    it('Treelist', () => {

        const t: Treelist<number> = [[1,[]]];
    });


    it('mapTreelist', () => {

        const t: Treelist<number> =
            [
                [1,[
                    [13,[]],
                    [14,[]],
                ]],
                [3,[]]
            ];

        const exp: Treelist<number> =
            [
                [2,[
                    [26,[]],
                    [28,[]],
                ]],
                [6,[]]
            ];

        const result = mapTreelist((_: number) => _ * 2, t);
        expect(equal(result, exp)).toBeTruthy();
    });


    it('mapLeafs', () => {

        const t: Treelist<number> =
            [
                [1,[
                    [13,[]],
                    [14,[]],
                ]],
                [3,[]]
            ];

        const exp: Treelist<number> =
            [
                [3,[]],
                [1,[
                    [14,[]],
                    [13,[]],
                ]]
            ];

        const result = mapLeafs(reverse, t);
        expect(equal(result, exp)).toBeTruthy();
    });


    it('flatten', () => {

        const a = { a: 1 };

        const t: Treelist<any> =
            [
                [1,[
                    [13,[[a,[]]]],
                    [16,[]],
                ]],
                [3,[]]
            ];

        const exp: Array<any> =
            [
                1,
                13,
                a,
                16,
                3
            ];

        expect(equal(flattenTreelist(t), exp)).toBeTruthy();
        expect(exp[2]).toBe(a); // retains original instancesf
    });
});
