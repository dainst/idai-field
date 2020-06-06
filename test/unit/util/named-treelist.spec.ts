import {
    filterTrees,
    findInNamedTreelist,
    isTopLevelItemOrChildThereof,
    removeTrees
} from '../../../src/app/core/util/named-treelist';
import {Named} from '../../../src/app/core/util/named';
import {accessTreelist, Treelist} from '../../../src/app/core/util/treelist';


describe('NamedTreelist', () => {

    function threeLevels(): any {

        const parent1 = { name: 'P1' }
        const child1 = { name: 'C1' };
        const child2 = { name: 'C2' };

        return [
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
    }

    it('findInNamedTreelist', () => {

        const t = threeLevels();
        const result = findInNamedTreelist('C1', t);

        expect(result.name).toBe('C1');
    });


    it('isTopLevelItemOrChildThereof', () => {

        const categoryTreelist: Treelist<Named> = [
            [
                { name: 'Image'},
                [
                    [
                        { name: 'Drawing'},
                        []
                    ]
                ]
            ],
            [
                { name: 'Operation' },
                []
            ],
            [
                { name: 'Inscription' },
                []
            ],
            [
                { name: 'Type' },
                []
            ],
            [
                { name: 'TypeCatalog' },
                []
            ],
        ];

        expect(isTopLevelItemOrChildThereof(categoryTreelist, 'Image', 'Image')).toBeTruthy();
        expect(isTopLevelItemOrChildThereof(categoryTreelist, 'Drawing', 'Image')).toBeTruthy();

        expect(isTopLevelItemOrChildThereof(categoryTreelist, 'Image', 'Operation')).toBeFalsy();

        expect(isTopLevelItemOrChildThereof(categoryTreelist, 'Drawing', 'Imag')).toBeFalsy();
    });


    it('isTopLevelItemOrChildThereof - more firstLevelItems to match', () => {

        const categoryTreelist: Treelist<Named> = [
            [
                { name: 'Image'},
                [
                    [
                        { name: 'Drawing'},
                        []
                    ]
                ]
            ],
            [
                { name: 'Operation' },
                []
            ],
            [
                { name: 'Inscription' },
                []
            ],
            [
                { name: 'Type' },
                []
            ],
            [
                { name: 'TypeCatalog' },
                []
            ],
        ];

        expect(isTopLevelItemOrChildThereof(categoryTreelist, 'Operation', 'Image', 'Type')).toBeFalsy();
        expect(isTopLevelItemOrChildThereof(categoryTreelist, 'Drawing', 'Type', 'Image')).toBeTruthy();
    });


    it('removeTrees', () => {

        const categoryTreelist: Treelist<Named> = [
            [
                { name: 'Image'},
                [
                    [
                        { name: 'Drawing'},
                        []
                    ]
                ]
            ],
            [
                { name: 'Operation' },
                []
            ],
            [
                { name: 'Inscription' },
                []
            ]
        ];

        const result = removeTrees(categoryTreelist, 'Operation', 'Inscription');

        expect(result.length).toBe(1);
        expect(accessTreelist(result, 0).name).toBe('Image');
        expect(accessTreelist(result, 0, 0).name).toBe('Drawing');
    });


    it('filterTrees', () => {

        const categoryTreelist: Treelist<Named> = [
            [
                { name: 'Image'},
                [
                    [
                        { name: 'Drawing'},
                        []
                    ]
                ]
            ],
            [
                { name: 'Operation' },
                []
            ],
            [
                { name: 'Inscription' },
                []
            ]
        ];

        const result0 = filterTrees(categoryTreelist, 'Operation');

        expect(result0.length).toBe(1);
        expect(accessTreelist(result0, 0).name).toBe('Operation');

        const result1 = filterTrees(categoryTreelist, 'Operation', 'Inscription');

        expect(result1.length).toBe(2);
        expect(accessTreelist(result1, 0).name).toBe('Operation');
        expect(accessTreelist(result1, 1).name).toBe('Inscription');

        const result2 = filterTrees('Operation', 'Inscription')(categoryTreelist);

        expect(result2.length).toBe(2);
        expect(accessTreelist(result2, 0).name).toBe('Operation');
        expect(accessTreelist(result2, 1).name).toBe('Inscription');

        const result3 = filterTrees('Operation')(categoryTreelist);

        expect(result3.length).toBe(1);
        expect(accessTreelist(result3, 0).name).toBe('Operation');


        // typing
        // const result = filterTrees(categoryTreelist);
        // const result = filterTrees()(categoryTreelist);
        // const result: Treelist<Named> = filterTrees('Operation');
    });
});
