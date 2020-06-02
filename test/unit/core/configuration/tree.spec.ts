import {equal} from 'tsfun';
import {mapTree, Tree} from '../../../../src/app/core/configuration/tree';

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

        const result = mapTree((_: number) => _ * 2, t);
        expect(equal(result, exp)).toBeTruthy();
    });
});
