import {equal, is, on, reverse} from 'tsfun';
import {
    accessTree,
    findInTree,
    flattenTree,
    mapTrees,
    mapTreelist, Tree,
    Treelist, mapTree, buildTreelist, buildTree
} from '../../../src/app/core/util/treelist';


describe('Treelist|Tree', () => {

    it('Treelist', () => {

        const t: Treelist<number> = [{ item: 1, trees: []}];
    });


    it('buildTreelist', () => {

        expect(
            equal(
                buildTreelist([[3, [[17, []]]]]),
                [
                    {
                        item: 3,
                        trees: [
                            {
                                item: 17,
                                trees: []
                            }
                        ]
                    }
                ]
            )
        ).toBeTruthy();
    });


    it('mapTree', () => {

        const t: Tree<number> = buildTree(
            [
                17,
                [
                    [1,
                        [
                            [13, []],
                            [14, []],
                        ]
                    ],
                    [3, []]
                ]
            ]
        );

        const exp: Tree<number> = buildTree([
            34,
            [
                [2, [
                        [26, []],
                        [28, []],
                    ]],
                [6, []]
            ]
        ]);

        const result = mapTree((_: number) => _ * 2, t);
        expect(equal(result, exp)).toBeTruthy();
    });


    it('mapTreelist', () => {

        const t: Treelist<number> = buildTreelist(
            [
                [1, [
                        [13, []],
                        [14, []],
                ]],
                [3, []]
            ]);

        const exp: Treelist<number> = buildTreelist(
            [
                [2, [
                        [26, []],
                        [28, []],
                ]],
                [6, []]
            ]);

        const result = mapTreelist((_: number) => _ * 2, t);
        expect(equal(result, exp)).toBeTruthy();
    });


    it('mapTreelists', () => {

        const t: Treelist<number> = buildTreelist(
            [
                [1, [
                        [13, []],
                        [14, []],
                ]],
                [3, []]
            ]);

        const exp: Treelist<number> = buildTreelist(
            [
                [3, []],
                [1, [
                        [14, []],
                        [13, []],
                ]]
            ]);

        const result = mapTrees(reverse, t);
        expect(equal(result, exp)).toBeTruthy();
    });


    it('flatten', () => {

        const a = { a: 1 };

        const t: Treelist<any> = buildTreelist<any>(
            [
                [1, [
                        [13, [[a, []]]],
                        [16, []],
                ]],
                [3, []]
            ]);

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

        const t: Tree<any> = buildTree<any>([
            17,
            [
                [1, [
                        [13, [[a, []]]],
                        [16, []],
                    ]],
                [3, []]
            ]
        ]);

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

        const t: Treelist<any> = buildTreelist<any>(
            [
                [1, [
                        [13, [[17, []]]],
                        [16, []],
                ]],
                [3, []]
            ]);

        const exp1: Tree<any> = findInTree(13, t);
        expect(equal(exp1,buildTree([13, [[17, []]]]))).toBeTruthy();

        const exp2: Tree<any> = findInTree(19, t);
        expect(equal(exp2,undefined)).toBeTruthy();
    });


    it('findInTreelist - tree', () => {

        const t: Tree<any> = buildTree([
            17,
            [
                [4, []]
            ]
        ]);

        const exp1: Tree<any> = findInTree(17, t);
        expect(equal(exp1,buildTree([17, [[4, []]]]))).toBeTruthy();

        const exp2: Tree<any> = findInTree(15, t);
        expect(equal(exp2,undefined)).toBeTruthy();
    });


    it('findInTreelist with Predicate', () => {

        const a = { a: 3 };

        const t: Treelist<any> = buildTreelist<any>(
            [
                [1, [
                        [a, [[17, []]]],
                        [16, []],
                ]],
                [3, []]
            ]);

        const exp1: Tree<any> = findInTree(on('a', is(3)), t);
        expect(equal(exp1,buildTree<any>([{a: 3}, [[17, []]]]))).toBeTruthy();
    });


    it('findInTreelist with Comparator', () => {

        const a = { a: 3 };
        const t: Treelist<any> = buildTreelist<any>(
            [
                [1, [
                        [a, [[17, []]]],
                        [16, []],
                ]],
                [3, []]
            ]);

        const exp1: Tree<any> = findInTree({ a: 3 }, t, on('a'));
        expect(equal(exp1, buildTree<any>(
                [
                    {a: 3},
                    [
                        [ 17, [] ]
                    ]
                ]
        ))).toBeTruthy();
    });


    it('accessTreelist - first level', () => {

        expect(accessTree(buildTreelist(
            [
                [
                    7,
                    []
                ]
            ]),
            0
        )).toEqual(7);
    });


    it('accessTreelist - second level', () => {

        expect(accessTree(buildTreelist(
            [
                [
                    7,
                    [
                        [
                            8,
                            []
                        ]
                    ]
                ]
            ]),
            0, 0
        )).toEqual(8);
    });


    it('accessTreelist - tree', () => {

        expect(accessTree(buildTree(

            [
                7,
                [
                    [
                        8,
                        []
                    ]
                ]
            ]
            ),
            0
        )).toEqual(8);
    });


    it('accessTreelist - tree - deeper and wider', () => {

        expect(accessTree(buildTree(

            [
                7,
                [
                    [
                        8,
                        [
                            [
                                9,
                                []
                            ],
                            [
                                11,
                                []
                            ]
                        ]
                    ]
                ]
            ])
            ,
            0, 1
        )).toEqual(11);
    });


    it('accessTreelist - tree - root', () => {

        expect(accessTree(buildTree(

            [
                7,
                [
                    [
                        8,
                        []
                    ]
                ]
            ]
        ))).toEqual(7);
    });
});
