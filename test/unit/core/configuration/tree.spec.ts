import {equal, reverse} from 'tsfun';
import {Tree} from '../../../../src/app/core/configuration/tree';

describe('Tree', () => {

    it('Tree', () => {

        const t: Tree<number> = [[1,[]]];
    });


    it('mapTree', () => {

        const t: Tree<number> =
            [
                [1,[
                    [13,[]],
                    [14,[]],
                ]],
                [3,[]]
            ];

        const exp: Tree<number> =
            [
                [2,[
                    [26,[]],
                    [28,[]],
                ]],
                [6,[]]
            ];

        const result = Tree.map((_: number) => _ * 2, t);
        expect(equal(result, exp)).toBeTruthy();
    });


    it('mapLeafs', () => {

        const t: Tree<number> =
            [
                [1,[
                    [13,[]],
                    [14,[]],
                ]],
                [3,[]]
            ];

        const exp: Tree<number> =
            [
                [3,[]],
                [1,[
                    [14,[]],
                    [13,[]],
                ]]
            ];

        const result = Tree.mapLeafs(reverse, t);
        expect(equal(result, exp)).toBeTruthy();
    });
});
