import {equal, is, on, reverse} from 'tsfun';
import {
    findInTreelist,
    flattenTreelist,
    mapLeafs,
    mapTreelist, Tree,
    Treelist
} from '../../../../src/app/core/configuration/treelist';
import {equalBy} from 'tsfun/by';


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


    it('findInTreelist', () => {

        const t: Treelist<any> =
            [
                [1,[
                    [13,[[17,[]]]],
                    [16,[]],
                ]],
                [3,[]]
            ];

        const exp1: Tree<any> = findInTreelist(13, t);
        expect(equal(exp1,[13,[[17,[]]]])).toBeTruthy();

        const exp2: Tree<any> = findInTreelist(19, t);
        expect(equal(exp2,undefined)).toBeTruthy();
    });


    it('findInTreelist with Preciate', () => {

        const a = { a: 3 };

        const t: Treelist<any> =
            [
                [1,[
                    [a,[[17,[]]]],
                    [16,[]],
                ]],
                [3,[]]
            ];

        const exp1: Tree<any> = findInTreelist(on('a', is(3)), t);
        expect(equal(exp1,[{a: 3},[[17,[]]]])).toBeTruthy();
    });


    it('findInTreelist with Comparator', () => {

        const a = { a: 3 };
        const t: Treelist<any> =
            [
                [1,[
                    [a,[[17,[]]]],
                    [16,[]],
                ]],
                [3,[]]
            ];

        const exp1: Tree<any> = findInTreelist({ a: 3 }, t, on('a'));
        expect(equal(exp1,[{a: 3},[[17,[]]]])).toBeTruthy();
    });
});
