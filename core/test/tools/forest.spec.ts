import {equal, is, on, reverse} from 'tsfun';
import {
    Tree, Forest
} from '../../src/tools/forest';


describe('Forest|Tree', () => {

    it('Forest', () => {

        const t: Forest<number> = [{ item: 1, trees: []}];
    });


    it('buildForest', () => {

        expect(
            equal(
                Tree.buildForest([[3, [[17, []]]]]),
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


    it('mapForest', () => {

        const t: Forest<number> = Tree.buildForest(
            [
                [1, [
                        [13, []],
                        [14, []],
                ]],
                [3, []]
            ]);

        const exp: Forest<number> = Tree.buildForest(
            [
                [2, [
                        [26, []],
                        [28, []],
                ]],
                [6, []]
            ]);

        const result = Tree.mapForest((_: number) => _ * 2, t);
        expect(equal(result, exp)).toBeTruthy();
    });


    it('mapForests', () => {

        const t: Forest<number> = Tree.buildForest(
            [
                [1, [
                        [13, []],
                        [14, []],
                ]],
                [3, []]
            ]);

        const exp: Forest<number> = Tree.buildForest(
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

        const t: Forest<any> = Tree.buildForest<any>(
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


    it('findInForest', () => {

        const t: Forest<any> = Tree.buildForest<any>(
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


    it('findInForest - tree', () => {

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


    it('findInForest with Predicate', () => {

        const a = { a: 3 };

        const t: Forest = Tree.buildForest<any>(
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


    it('findInForest with Comparator', () => {

        const a = { a: 3 };
        const t: Forest = Tree.buildForest<any>(
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


    it('accessForest - first level', () => {

        expect(Tree.access(Tree.buildForest(
            [
                [
                    7,
                    []
                ]
            ]),
            0
        )).toEqual(7);
    });


    it('accessForest - second level', () => {

        expect(Tree.access(Tree.buildForest(
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


    it('accessForest - tree', () => {

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


    it('accessForest - tree - deeper and wider', () => {

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


    it('accessForest - tree - root', () => {

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


    it('zipForestWith', () => {

        const tl1 = Tree.buildForest([[3, []]]);
        const tl2 = Tree.buildForest([[76, []]]);

        const result = Tree.zipForest(([item1, item2]: [any, any]) => {
            return item1 + item2;
        }, [tl1, tl2]);

        expect(equal(result, Tree.buildForest([[79,[]]]))).toBeTruthy();
    });


    it('zipForestWith - recursive', () => {

        const tl1 = Tree.buildForest([[3, [[5, []]]]]);
        const tl2 = Tree.buildForest([[76, [[7, []]]]]);

        const result = Tree.zipForest(([item1, item2]: [any, any]) => {
            return item1 + item2;
        }, [tl1, tl2]);

        expect(equal(result, Tree.buildForest([[79,[[12,[]]]]]))).toBeTruthy();
    });


    it('zipForestWith - no zipper, recursive', () => {

        const tl1 = Tree.buildForest([[3, [[5, []]]]]);
        const tl2 = Tree.buildForest([[76, [[7, []]]]]);

        const result = Tree.zipForest([tl1, tl2]);

        expect(equal(result, Tree.buildForest([[[3,76],[[[5,7],[]]]]]))).toBeTruthy();
    })
});
