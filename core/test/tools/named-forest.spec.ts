import { filterTrees, findInNamedForest, isTopLevelItemOrChildThereof,
    removeTrees } from '../../src/tools/named-forest';
import { Named } from '../../src/tools/named';
import { Tree, Forest } from '../../src/tools/forest';


describe('NamedForest', () => {

    function threeLevels(): any {

        const parent1 = { name: 'P1' };
        const child1 = { name: 'C1' };
        const child2 = { name: 'C2' };

        return Forest.build([
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
        ])
    }

    it('findInNamedForest', () => {

        const t = threeLevels();
        const result = findInNamedForest('C1', t);

        expect(result.name).toBe('C1');
    });


    it('isTopLevelItemOrChildThereof', () => {

        const categoryForest: Forest<Named> = Forest.build([
            [
                { name: 'Image' },
                [
                    [
                        { name: 'Drawing' },
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
            ]
        ]);

        expect(isTopLevelItemOrChildThereof(categoryForest, 'Image', 'Image')).toBeTruthy();
        expect(isTopLevelItemOrChildThereof(categoryForest, 'Drawing', 'Image')).toBeTruthy();

        expect(isTopLevelItemOrChildThereof(categoryForest, 'Image', 'Operation')).toBeFalsy();

        expect(isTopLevelItemOrChildThereof(categoryForest, 'Drawing', 'Imag')).toBeFalsy();
    });


    it('isTopLevelItemOrChildThereof - more firstLevelItems to match', () => {

        const categoryForest: Forest<Named> = Forest.build([
            [
                { name: 'Image' },
                [
                    [
                        { name: 'Drawing' },
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
        ]);

        expect(isTopLevelItemOrChildThereof(categoryForest, 'Operation', 'Image', 'Type')).toBeFalsy();
        expect(isTopLevelItemOrChildThereof(categoryForest, 'Drawing', 'Type', 'Image')).toBeTruthy();
    });


    it('removeTrees', () => {

        const categoryForest: Forest<Named> = Forest.build([
            [
                { name: 'Image' },
                [
                    [
                        { name: 'Drawing' },
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
        ]);

        const result0 = removeTrees(categoryForest, 'Operation', 'Inscription');

        expect(result0.length).toBe(1);
        expect(Tree.access(result0, 0).name).toBe('Image');
        expect(Tree.access(result0, 0, 0).name).toBe('Drawing');

        const result1 = removeTrees('Operation', 'Inscription')(categoryForest);

        expect(result1.length).toBe(1);
        expect(Tree.access(result1, 0).name).toBe('Image');
        expect(Tree.access(result1, 0, 0).name).toBe('Drawing');

        const result2 = removeTrees('Image')(categoryForest);

        expect(result2.length).toBe(2);
        expect(Tree.access(result2, 0).name).toBe('Operation');
        expect(Tree.access(result2, 1).name).toBe('Inscription');

        const result3 = removeTrees(categoryForest, 'Image');

        expect(result3.length).toBe(2);
        expect(Tree.access(result3, 0).name).toBe('Operation');
        expect(Tree.access(result3, 1).name).toBe('Inscription');


        // typing
        // const result = removeTrees(categoryTreelist);
        // const result = removeTrees()(categoryTreelist);
        // const result: TreeList<Named> = removeTrees('Operation');
    });


    it('filterTrees', () => {

        const categoryForest: Forest<Named> = Forest.build([
            [
                { name: 'Image' },
                [
                    [
                        {name: 'Drawing' },
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
        ]);

        const result0 = filterTrees(categoryForest, 'Operation');

        expect(result0.length).toBe(1);
        expect(Tree.access(result0, 0).name).toBe('Operation');

        const result1 = filterTrees(categoryForest, 'Operation', 'Inscription');

        expect(result1.length).toBe(2);
        expect(Tree.access(result1, 0).name).toBe('Operation');
        expect(Tree.access(result1, 1).name).toBe('Inscription');

        const result2 = filterTrees('Operation', 'Inscription')(categoryForest);

        expect(result2.length).toBe(2);
        expect(Tree.access(result2, 0).name).toBe('Operation');
        expect(Tree.access(result2, 1).name).toBe('Inscription');

        const result3 = filterTrees('Operation')(categoryForest);

        expect(result3.length).toBe(1);
        expect(Tree.access(result3, 0).name).toBe('Operation');


        // typing
        // const result = filterTrees(categoryTreelist);
        // const result = filterTrees()(categoryTreelist);
        // const result: TreeList<Named> = filterTrees('Operation');
    });
});
