import {ProjectCategoriesHelper} from '../../../../src/app/core/configuration/project-categories-helper';
import isTopLevelItemOrChildThereof = ProjectCategoriesHelper.isTopLevelItemOrChildThereof;
import isGeometryCategory = ProjectCategoriesHelper.isGeometryCategory;


describe('ProjectConfigurationHelper', () => {

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

    it('isTopLevelItemOrChildThereof', () => {

        expect(isTopLevelItemOrChildThereof(categoryTree as any, 'Image', 'Image')).toBeTruthy();
        expect(isTopLevelItemOrChildThereof(categoryTree as any, 'Drawing', 'Image')).toBeTruthy();

        expect(isTopLevelItemOrChildThereof(categoryTree as any, 'Image', 'Operation')).toBeFalsy();

        expect(isTopLevelItemOrChildThereof(categoryTree as any, 'Drawing', 'Imag')).toBeFalsy();
    });


    it('isGeometryCategory', () => {

        expect(isGeometryCategory(categoryTree as any, 'Image')).toBeFalsy();
        expect(isGeometryCategory(categoryTree as any, 'Drawing')).toBeFalsy();
        expect(isGeometryCategory(categoryTree as any, 'Type')).toBeFalsy();
        expect(isGeometryCategory(categoryTree as any, 'TypeCatalog')).toBeFalsy();
        expect(isGeometryCategory(categoryTree as any, 'Inscription')).toBeFalsy();
        expect(isGeometryCategory(categoryTree as any, 'Project')).toBeFalsy();
        expect(isGeometryCategory(categoryTree as any, 'Operation')).toBeTruthy();
    });
});
