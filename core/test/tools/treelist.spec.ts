import {equal, is, on, reverse} from 'tsfun';
import {
    Tree, TreeList
} from '../../src/tools/tree-list';


describe('TreeList|Tree', () => {

    it('Treelist', () => {

        const t: TreeList<number> = [{ item: 1, trees: []}];
    });


    it('buildTreelist', () => {

        expect(
            equal(
                Tree.buildList([[3, [[17, []]]]]),
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

        const t: Tree<number> = Tree.build(
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

        const exp: Tree<number> = Tree.build([
            34,
            [
                [2, [
                        [26, []],
                        [28, []],
                    ]],
                [6, []]
            ]
        ]);

        const result = Tree.map((_: number) => _ * 2, t);
        expect(equal(result, exp)).toBeTruthy();
    });


    it('mapTreelist', () => {

        const t: TreeList<number> = Tree.buildList(
            [
                [1, [
                        [13, []],
                        [14, []],
                ]],
                [3, []]
            ]);

        const exp: TreeList<number> = Tree.buildList(
            [
                [2, [
                        [26, []],
                        [28, []],
                ]],
                [6, []]
            ]);

        const result = Tree.mapList((_: number) => _ * 2, t);
        expect(equal(result, exp)).toBeTruthy();
    });


    it('mapTreelists', () => {

        const t: TreeList<number> = Tree.buildList(
            [
                [1, [
                        [13, []],
                        [14, []],
                ]],
                [3, []]
            ]);

        const exp: TreeList<number> = Tree.buildList(
            [
                [3, []],
                [1, [
                        [14, []],
                        [13, []],
                ]]
            ]);

        const result = Tree.mapTrees(reverse, t);
        expect(equal(result, exp)).toBeTruthy();
    });


    it('flatten', () => {

        const a = { a: 1 };

        const t: TreeList<any> = Tree.buildList<any>(
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

        expect(equal(Tree.flatten(t), exp)).toBeTruthy();
        expect(exp[2]).toBe(a); // retains original instancesf
    });


    it('flatten - tree', () => {

        const a = { a: 1 };

        const t: Tree<any> = Tree.build<any>([
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

        expect(equal(Tree.flatten(t), exp)).toBeTruthy();
        expect(exp[3]).toBe(a); // retains original instancesf
    });


    it('findInTreelist', () => {

        const t: TreeList<any> = Tree.buildList<any>(
            [
                [1, [
                        [13, [[17, []]]],
                        [16, []],
                ]],
                [3, []]
            ]);

        const exp1: Tree = Tree.find(t, 13);
        expect(equal(exp1, Tree.build([13, [[17, []]]]))).toBeTruthy();

        const exp2: Tree = Tree.find(t, 19);
        expect(equal(exp2,undefined)).toBeTruthy();
    });


    it('findInTreelist - tree', () => {

        const t: Tree = Tree.build([
            17,
            [
                [4, []]
            ]
        ]);

        const exp1: Tree = Tree.find(t, 17);
        expect(equal(exp1, Tree.build([17, [[4, []]]]))).toBeTruthy();

        const exp2: Tree = Tree.find(t, 15);
        expect(equal(exp2,undefined)).toBeTruthy();
    });


    it('findInTreelist with Predicate', () => {

        const a = { a: 3 };

        const t: TreeList = Tree.buildList<any>(
            [
                [1, [
                        [a, [[17, []]]],
                        [16, []],
                ]],
                [3, []]
            ]);

        const exp1: Tree = Tree.find(t, on('a', is(3)));
        expect(equal(exp1, Tree.build<any>([{a: 3}, [[17, []]]]))).toBeTruthy();
    });


    it('findInTreelist with Comparator', () => {

        const a = { a: 3 };
        const t: TreeList = Tree.buildList<any>(
            [
                [1, [
                        [a, [[17, []]]],
                        [16, []],
                ]],
                [3, []]
            ]);

        const exp1: Tree = Tree.find(t, { a: 3 }, on('a'));
        expect(equal(exp1, Tree.build<any>(
                [
                    {a: 3},
                    [
                        [ 17, [] ]
                    ]
                ]
        ))).toBeTruthy();
    });


    it('accessTreelist - first level', () => {

        expect(Tree.access(Tree.buildList(
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

        expect(Tree.access(Tree.buildList(
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

        expect(Tree.access(Tree.build(

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

        expect(Tree.access(Tree.build(

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

        expect(Tree.access(Tree.build(

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

        const tl1 = Tree.buildList([[3, []]]);
        const tl2 = Tree.buildList([[76, []]]);

        const result = Tree.zipList(([item1, item2]: [any, any]) => {
            return item1 + item2;
        }, [tl1, tl2]);

        expect(equal(result, Tree.buildList([[79,[]]]))).toBeTruthy();
    });


    it('zipTreeListWith - recursive', () => {

        const tl1 = Tree.buildList([[3, [[5, []]]]]);
        const tl2 = Tree.buildList([[76, [[7, []]]]]);

        const result = Tree.zipList(([item1, item2]: [any, any]) => {
            return item1 + item2;
        }, [tl1, tl2]);

        expect(equal(result, Tree.buildList([[79,[[12,[]]]]]))).toBeTruthy();
    });


    it('zipTreeListWith - no zipper, recursive', () => {

        const tl1 = Tree.buildList([[3, [[5, []]]]]);
        const tl2 = Tree.buildList([[76, [[7, []]]]]);

        const result = Tree.zipList([tl1, tl2]);

        expect(equal(result, Tree.buildList([[[3,76],[[[5,7],[]]]]]))).toBeTruthy();
    })
});
