import {
    categoryTreelistToArray,
    categoryTreelistToMap, linkParentAndChildInstances
} from '../../../../src/app/core/configuration/category-treelist';


describe('CategoryTreelist', () => {

    it('categoryTreelistToArray', () => {

        const parent = { name: 'P1', children: [] }
        const child = { name: 'C1', parentCategory: parent, children: [] };
        parent.children = [child];

        const t = [
            [
                parent,
                [
                    [
                        child,
                        []
                    ]
                ]
            ]
        ]

        const result = categoryTreelistToArray(t as any);

        expect(result[0].name).toBe('P1');
        expect(result[0].children.length).toBe(1);
        expect(result[0].children[0].name).toBe('C1');
        expect(result[0].children[0].children.length).toBe(0);
        expect(result[0].children[0].children).toEqual([]);

        expect(result[1].name).toBe('C1');
        expect(result[1].children.length).toBe(0);
        expect(result[1].children).toEqual([]);

        // retain configured instance relationships
        expect(result[0].children[0] === t[0][1][0][0]).toBeTruthy();
        expect(result[1].parentCategory === t[0][0]).toBeTruthy();
        expect(result[1].parentCategory === result[0]).toBeTruthy();
        expect(result[0].children[0].name === 'C1').toBeTruthy();
        expect(result[1].parentCategory.name === 'P1').toBeTruthy();
    });


    it('categoryTreelistToMap', () => {

        const parent = { name: 'P1', children: [] }
        const child = { name: 'C1', parentCategory: parent, children: [] };
        parent.children = [child];

        const t = [
            [
                parent,
                [
                    [
                        child,
                        []
                    ]
                ]
            ]
        ]

        const result = categoryTreelistToMap(t as any);

        expect(result['P1'].name).toBe('P1');
        expect(result['P1'].children.length).toBe(1);
        expect(result['P1'].children[0].name).toBe('C1');
        expect(result['P1'].children[0].children.length).toBe(0);
        expect(result['P1'].children[0].children).toEqual([]);

        expect(result['C1'].name).toBe('C1');
        expect(result['C1'].children.length).toBe(0);
        expect(result['C1'].children).toEqual([]);

        // retain configured instance relationships
        expect(result['P1'].children[0] === t[0][1][0][0]).toBeTruthy();
        expect(result['C1'].parentCategory === t[0][0]).toBeTruthy();
        expect(result['C1'].parentCategory === result['P1']).toBeTruthy();
        expect(result['P1'].children[0].name === 'C1').toBeTruthy();
        expect(result['C1'].parentCategory.name === 'P1').toBeTruthy();
    });


    it('multiple parent items', () => {

        const parent1 = { name: 'P1', children: [] }
        const child1 = { name: 'C1', parentCategory: parent1, children: [] };
        const child2 = { name: 'C2', parentCategory: parent1, children: [] };
        parent1.children = [child1,child2];

        const parent2 = { name: 'P2', children: [] }
        const child3 = { name: 'C3', parentCategory: parent2, children: [] };
        const child4 = { name: 'C4', parentCategory: parent2, children: [] };
        parent2.children = [child3,child4];

        const t = [
            [
                parent1,
                [
                    [
                        child1,
                        []
                    ],
                    [
                        child2,
                        []
                    ]
                ]
            ],
            [
                parent2,
                [
                    [
                        child3,
                        []
                    ],
                    [
                        child4,
                        []
                    ]
                ]
            ]
        ]

        const result = categoryTreelistToArray(t as any);

        expect(result.length).toBe(6);

        expect(result[0].name).toBe('P1');
        expect(result[0].children.length).toBe(2);
        expect(result[0].children[0].name).toBe('C1');
        expect(result[0].children[1].name).toBe('C2');
        expect(result[0].children[0].children.length).toBe(0);
        expect(result[0].children[1].children.length).toBe(0);

        expect(result[1].name).toBe('P2');
        expect(result[1].children.length).toBe(2);
        expect(result[1].children[0].name).toBe('C3');
        expect(result[1].children[1].name).toBe('C4');
        expect(result[1].children[0].children.length).toBe(0);
        expect(result[1].children[1].children.length).toBe(0);

        expect(result[2].name).toBe('C1');
        expect(result[2].children.length).toBe(0);
        expect(result[3].name).toBe('C2');
        expect(result[3].children.length).toBe(0);
        expect(result[4].name).toBe('C3');
        expect(result[4].children.length).toBe(0);
        expect(result[5].name).toBe('C4');
        expect(result[4].children.length).toBe(0);
    });


    it('linkParentAndChildInstances', () => {

        const parent1 = { name: 'P1' }
        const child1 = { name: 'C1' };
        const child2 = { name: 'C1' };

        const t = [
            [
                parent1,
                [
                    [
                        child1,
                        [
                            [
                                child2,
                                []
                            ]
                        ]
                    ]
                ]
            ]
        ]

        const result = linkParentAndChildInstances(t as any);
        expect(result[0][0].children[0] === result[0][1][0][0]).toBeTruthy();
        expect(result[0][1][0][0].children[0] === result[0][1][0][1][0][0]).toBeTruthy();
        expect(result[0][1][0][1][0][0].parentCategory === result[0][1][0][0]).toBeTruthy();
        expect(result[0][1][0][0].parentCategory === result[0][0]).toBeTruthy();
    });
});
