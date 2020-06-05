import {findInNamedTreelist, isTopLevelItemOrChildThereof} from '../../../../src/app/core/configuration/named-treelist';


describe('CategoryTreelist', () => {

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

        const categoryTree = [
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

        expect(isTopLevelItemOrChildThereof(categoryTree as any, 'Image', 'Image')).toBeTruthy();
        expect(isTopLevelItemOrChildThereof(categoryTree as any, 'Drawing', 'Image')).toBeTruthy();

        expect(isTopLevelItemOrChildThereof(categoryTree as any, 'Image', 'Operation')).toBeFalsy();

        expect(isTopLevelItemOrChildThereof(categoryTree as any, 'Drawing', 'Imag')).toBeFalsy();
    });
});
