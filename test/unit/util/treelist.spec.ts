import {equal, is, on, reverse} from 'tsfun';
import {
    accessTreelist,
    findInTreelist,
    flattenTreelist,
    mapTreelists,
    mapTreelist, Tree,
    Treelist
} from '../../../src/app/core/util/treelist';


describe('Treelist', () => {

    it('Treelist', () => {

        const t: Treelist<number> = [{ node: 1, trees: []}];
    });


    it('mapTreelist', () => {

        const t: Treelist<number> =
            [
                { node: 1, trees: [
                        { node: 13, trees: []},
                        { node: 14, trees: []},
                ]},
                { node: 3, trees: []}
            ];

        const exp: Treelist<number> =
            [
                { node: 2, trees: [
                        { node: 26, trees: []},
                        { node: 28, trees: []},
                ]},
                { node: 6, trees: []}
            ];

        const result = mapTreelist((_: number) => _ * 2, t);
        expect(equal(result, exp)).toBeTruthy();
    });


    it('mapTreelists', () => {

        const t: Treelist<number> =
            [
                { node: 1, trees: [
                        { node: 13, trees: []},
                        { node: 14, trees: []},
                ]},
                { node: 3, trees: []}
            ];

        const exp: Treelist<number> =
            [
                { node: 3, trees: []},
                { node: 1, trees: [
                        { node: 14, trees: []},
                        { node: 13, trees: []},
                ]}
            ];

        const result = mapTreelists(reverse, t);
        expect(equal(result, exp)).toBeTruthy();
    });


    it('flatten', () => {

        const a = { a: 1 };

        const t: Treelist<any> =
            [
                { node: 1, trees: [
                        { node: 13, trees: [{ node: a, trees: []}]},
                        { node: 16, trees: []},
                ]},
                { node: 3, trees: []}
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
                { node: 1, trees: [
                        { node: 13, trees: [{ node: 17, trees: []}]},
                        { node: 16, trees: []},
                ]},
                { node: 3, trees: []}
            ];

        const exp1: Tree<any> = findInTreelist(13, t);
        expect(equal(exp1,{ node: 13, trees: [{ node: 17, trees: []}]})).toBeTruthy();

        const exp2: Tree<any> = findInTreelist(19, t);
        expect(equal(exp2,undefined)).toBeTruthy();
    });


    it('findInTreelist with Preciate', () => {

        const a = { a: 3 };

        const t: Treelist<any> =
            [
                { node: 1, trees: [
                        { node: a, trees: [{ node: 17, trees: []}]},
                        { node: 16, trees: []},
                ]},
                { node: 3, trees: []}
            ];

        const exp1: Tree<any> = findInTreelist(on('a', is(3)), t);
        expect(equal(exp1,{ node: {a: 3}, trees: [{ node: 17, trees: []}]})).toBeTruthy();
    });


    it('findInTreelist with Comparator', () => {

        const a = { a: 3 };
        const t: Treelist<any> =
            [
                { node: 1, trees: [
                        { node: a, trees: [{ node: 17, trees: []}]},
                        { node: 16, trees: []},
                ]},
                { node: 3, trees: []}
            ];

        const exp1: Tree<any> = findInTreelist({ a: 3 }, t, on('a'));
        expect(equal(exp1,{ node: {a: 3}, trees: [{ node: 17, trees: []}]})).toBeTruthy();
    });


    it('accessTreelist - first level', () => {

        expect(accessTreelist(
            [
                {
                    node: 7,
                    trees: []
                }
            ],
            0
        )).toEqual(7);
    });


    it('accessTreelist - second level', () => {

        expect(accessTreelist(
            [
                {
                    node: 7,
                    trees: [
                        {
                            node: 8,
                            trees: []
                        }
                    ]
                }
            ],
            0, 0
        )).toEqual(8);
    });
});
