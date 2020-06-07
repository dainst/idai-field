import {equal, is, on, reverse} from 'tsfun';
import {
    accessT,
    findInTree,
    flattenTree,
    mapTrees,
    mapTreelist, Tree,
    Treelist, mapTree
} from '../../../src/app/core/util/treelist';


describe('Treelist|Tree', () => {

    it('Treelist', () => {

        const t: Treelist<number> = [{ t: 1, trees: []}];
    });


    it('mapTree', () => {

        const t: Tree<number> = {
            t: 17,
            trees: [
                { t: 1, trees: [
                        { t: 13, trees: []},
                        { t: 14, trees: []},
                    ]},
                { t: 3, trees: []}
            ]
        };

        const exp: Tree<number> = {
            t: 34,
            trees: [
                { t: 2, trees: [
                        { t: 26, trees: []},
                        { t: 28, trees: []},
                    ]},
                { t: 6, trees: []}
            ]
        };

        const result = mapTree((_: number) => _ * 2, t);
        expect(equal(result, exp)).toBeTruthy();
    });


    it('mapTreelist', () => {

        const t: Treelist<number> =
            [
                { t: 1, trees: [
                        { t: 13, trees: []},
                        { t: 14, trees: []},
                ]},
                { t: 3, trees: []}
            ];

        const exp: Treelist<number> =
            [
                { t: 2, trees: [
                        { t: 26, trees: []},
                        { t: 28, trees: []},
                ]},
                { t: 6, trees: []}
            ];

        const result = mapTreelist((_: number) => _ * 2, t);
        expect(equal(result, exp)).toBeTruthy();
    });


    it('mapTreelists', () => {

        const t: Treelist<number> =
            [
                { t: 1, trees: [
                        { t: 13, trees: []},
                        { t: 14, trees: []},
                ]},
                { t: 3, trees: []}
            ];

        const exp: Treelist<number> =
            [
                { t: 3, trees: []},
                { t: 1, trees: [
                        { t: 14, trees: []},
                        { t: 13, trees: []},
                ]}
            ];

        const result = mapTrees(reverse, t);
        expect(equal(result, exp)).toBeTruthy();
    });


    it('flatten', () => {

        const a = { a: 1 };

        const t: Treelist<any> =
            [
                { t: 1, trees: [
                        { t: 13, trees: [{ t: a, trees: []}]},
                        { t: 16, trees: []},
                ]},
                { t: 3, trees: []}
            ];

        const exp: Array<any> =
            [
                1,
                13,
                a,
                16,
                3
            ];

        expect(equal(flattenTree(t), exp)).toBeTruthy();
        expect(exp[2]).toBe(a); // retains original instancesf
    });


    it('flatten - tree', () => {

        const a = { a: 1 };

        const t: Tree<any> = {
            t: 17,
            trees: [
                { t: 1, trees: [
                        { t: 13, trees: [{ t: a, trees: []}]},
                        { t: 16, trees: []},
                    ]},
                { t: 3, trees: []}
            ]
        };

        const exp: Array<any> =
            [
                17,
                1,
                13,
                a,
                16,
                3
            ];

        expect(equal(flattenTree(t), exp)).toBeTruthy();
        expect(exp[3]).toBe(a); // retains original instancesf
    });


    it('findInTreelist', () => {

        const t: Treelist<any> =
            [
                { t: 1, trees: [
                        { t: 13, trees: [{ t: 17, trees: []}]},
                        { t: 16, trees: []},
                ]},
                { t: 3, trees: []}
            ];

        const exp1: Tree<any> = findInTree(13, t);
        expect(equal(exp1,{ t: 13, trees: [{ t: 17, trees: []}]})).toBeTruthy();

        const exp2: Tree<any> = findInTree(19, t);
        expect(equal(exp2,undefined)).toBeTruthy();
    });


    it('findInTreelist - tree', () => {

        const t: Tree<any> = {
            t: 17,
            trees: [
                { t: 4, trees: []}
            ]
        };

        const exp1: Tree<any> = findInTree(17, t);
        expect(equal(exp1,{ t: 17, trees: [{ t: 4, trees: []}]})).toBeTruthy();

        const exp2: Tree<any> = findInTree(15, t);
        expect(equal(exp2,undefined)).toBeTruthy();
    });


    it('findInTreelist with Predicate', () => {

        const a = { a: 3 };

        const t: Treelist<any> =
            [
                { t: 1, trees: [
                        { t: a, trees: [{ t: 17, trees: []}]},
                        { t: 16, trees: []},
                ]},
                { t: 3, trees: []}
            ];

        const exp1: Tree<any> = findInTree(on('a', is(3)), t);
        expect(equal(exp1,{ t: {a: 3}, trees: [{ t: 17, trees: []}]})).toBeTruthy();
    });


    it('findInTreelist with Comparator', () => {

        const a = { a: 3 };
        const t: Treelist<any> =
            [
                { t: 1, trees: [
                        { t: a, trees: [{ t: 17, trees: []}]},
                        { t: 16, trees: []},
                ]},
                { t: 3, trees: []}
            ];

        const exp1: Tree<any> = findInTree({ a: 3 }, t, on('a'));
        expect(equal(exp1,{ t: {a: 3}, trees: [{ t: 17, trees: []}]})).toBeTruthy();
    });


    it('accessTreelist - first level', () => {

        expect(accessT(
            [
                {
                    t: 7,
                    trees: []
                }
            ],
            0
        )).toEqual(7);
    });


    it('accessTreelist - second level', () => {

        expect(accessT(
            [
                {
                    t: 7,
                    trees: [
                        {
                            t: 8,
                            trees: []
                        }
                    ]
                }
            ],
            0, 0
        )).toEqual(8);
    });


    it('accessTreelist - tree', () => {

        expect(accessT(

            {
                t: 7,
                trees: [
                    {
                        t: 8,
                        trees: []
                    }
                ]
            }
        ,
            0
        )).toEqual(8);
    });


    it('accessTreelist - tree - deeper and wider', () => {

        expect(accessT(

            {
                t: 7,
                trees: [
                    {
                        t: 8,
                        trees: [
                            {
                                t: 9,
                                trees: []
                            },
                            {
                                t: 11,
                                trees: []
                            }
                        ]
                    }
                ]
            }
            ,
            0, 1
        )).toEqual(11);
    });


    it('accessTreelist - tree - root', () => {

        expect(accessT(

            {
                t: 7,
                trees: [
                    {
                        t: 8,
                        trees: []
                    }
                ]
            }
        )).toEqual(7);
    });
});
