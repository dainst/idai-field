import {equal, is, on, reverse} from 'tsfun';
import {
    accessT,
    findInTreelist,
    flattenTreelist,
    mapTreelists,
    mapTreelist, Tree,
    Treelist
} from '../../../src/app/core/util/treelist';


describe('Treelist', () => {

    it('Treelist', () => {

        const t: Treelist<number> = [{ t: 1, trees: []}];
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

        const result = mapTreelists(reverse, t);
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

        expect(equal(flattenTreelist(t), exp)).toBeTruthy();
        expect(exp[2]).toBe(a); // retains original instancesf
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

        const exp1: Tree<any> = findInTreelist(13, t);
        expect(equal(exp1,{ t: 13, trees: [{ t: 17, trees: []}]})).toBeTruthy();

        const exp2: Tree<any> = findInTreelist(19, t);
        expect(equal(exp2,undefined)).toBeTruthy();
    });


    it('findInTreelist with Preciate', () => {

        const a = { a: 3 };

        const t: Treelist<any> =
            [
                { t: 1, trees: [
                        { t: a, trees: [{ t: 17, trees: []}]},
                        { t: 16, trees: []},
                ]},
                { t: 3, trees: []}
            ];

        const exp1: Tree<any> = findInTreelist(on('a', is(3)), t);
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

        const exp1: Tree<any> = findInTreelist({ a: 3 }, t, on('a'));
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
