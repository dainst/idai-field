import {equal, is, on, reverse} from 'tsfun';
import {
    accessTree, findInTree, flattenTree, mapTrees, mapTreeList, Tree,
    TreeList, mapTree, buildTreeList, buildTree, zipTreeList
} from '../../../src/app/core/util/tree-list';


describe('TreeList|Tree', () => {

    it('Treelist', () => {

        const t: TreeList<number> = [{ item: 1, trees: []}];
    });


    it('buildTreelist', () => {

        expect(
            equal(
                buildTreeList([[3, [[17, []]]]]),
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

        const t: TreeList<number> = buildTreeList(
            [
                [1, [
                        [13, []],
                        [14, []],
                ]],
                [3, []]
            ]);

        const exp: TreeList<number> = buildTreeList(
            [
                [2, [
                        [26, []],
                        [28, []],
                ]],
                [6, []]
            ]);

        const result = mapTreeList((_: number) => _ * 2, t);
        expect(equal(result, exp)).toBeTruthy();
    });


    it('mapTreelists', () => {

        const t: TreeList<number> = buildTreeList(
            [
                [1, [
                        [13, []],
                        [14, []],
                ]],
                [3, []]
            ]);

        const exp: TreeList<number> = buildTreeList(
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

        const t: TreeList<any> = buildTreeList<any>(
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

        const t: TreeList<any> = buildTreeList<any>(
            [
                [1, [
                        [13, [[17, []]]],
                        [16, []],
                ]],
                [3, []]
            ]);

        const exp1: Tree = findInTree(t, 13);
        expect(equal(exp1,buildTree([13, [[17, []]]]))).toBeTruthy();

        const exp2: Tree = findInTree(t, 19);
        expect(equal(exp2,undefined)).toBeTruthy();
    });


    it('findInTreelist - tree', () => {

        const t: Tree = buildTree([
            17,
            [
                [4, []]
            ]
        ]);

        const exp1: Tree = findInTree(t, 17);
        expect(equal(exp1,buildTree([17, [[4, []]]]))).toBeTruthy();

        const exp2: Tree = findInTree(t, 15);
        expect(equal(exp2,undefined)).toBeTruthy();
    });


    it('findInTreelist with Predicate', () => {

        const a = { a: 3 };

        const t: TreeList = buildTreeList<any>(
            [
                [1, [
                        [a, [[17, []]]],
                        [16, []],
                ]],
                [3, []]
            ]);

        const exp1: Tree = findInTree(t, on('a', is(3)));
        expect(equal(exp1,buildTree<any>([{a: 3}, [[17, []]]]))).toBeTruthy();
    });


    it('findInTreelist with Comparator', () => {

        const a = { a: 3 };
        const t: TreeList = buildTreeList<any>(
            [
                [1, [
                        [a, [[17, []]]],
                        [16, []],
                ]],
                [3, []]
            ]);

        const exp1: Tree = findInTree(t, { a: 3 }, on('a'));
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

        expect(accessTree(buildTreeList(
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

        expect(accessTree(buildTreeList(
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


    it('zipTreeListWith', () => {

        const tl1 = buildTreeList([[3, []]]);
        const tl2 = buildTreeList([[76, []]]);

        const result = zipTreeList(([item1, item2]: [any, any]) => {
            return item1 + item2;
        }, [tl1, tl2]);

        expect(equal(result, buildTreeList([[79,[]]]))).toBeTruthy();
    });


    it('zipTreeListWith - recursive', () => {

        const tl1 = buildTreeList([[3, [[5, []]]]]);
        const tl2 = buildTreeList([[76, [[7, []]]]]);

        const result = zipTreeList(([item1, item2]: [any, any]) => {
            return item1 + item2;
        }, [tl1, tl2]);

        expect(equal(result, buildTreeList([[79,[[12,[]]]]]))).toBeTruthy();
    });


    it('zipTreeListWith - no zipper, recursive', () => {

        const tl1 = buildTreeList([[3, [[5, []]]]]);
        const tl2 = buildTreeList([[76, [[7, []]]]]);

        const result = zipTreeList([tl1, tl2]);

        expect(equal(result, buildTreeList([[[3,76],[[[5,7],[]]]]]))).toBeTruthy();
    })
});
