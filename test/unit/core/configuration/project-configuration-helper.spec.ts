import {ProjectCategoriesHelper} from '../../../../src/app/core/configuration/project-categories-helper';
import isCategoryOrSubcategory = ProjectCategoriesHelper.isCategoryOrSubcategory;
import isGeometryCategory1 = ProjectCategoriesHelper.isGeometryCategory;


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

    it('isCategoryOrSubcategory', () => {

        expect(isCategoryOrSubcategory(categoryTree as any, 'Image', 'Image')).toBeTruthy();
        expect(isCategoryOrSubcategory(categoryTree as any, 'Drawing', 'Image')).toBeTruthy();

        expect(isCategoryOrSubcategory(categoryTree as any, 'Image', 'Operation')).toBeFalsy();

        expect(isCategoryOrSubcategory(categoryTree as any, 'Drawing', 'Imag')).toBeFalsy();
    });


    it('isGeometryCategory', () => {

        expect(isGeometryCategory1(categoryTree as any, 'Image')).toBeFalsy();
        expect(isGeometryCategory1(categoryTree as any, 'Drawing')).toBeFalsy();
        expect(isGeometryCategory1(categoryTree as any, 'Type')).toBeFalsy();
        expect(isGeometryCategory1(categoryTree as any, 'TypeCatalog')).toBeFalsy();
        expect(isGeometryCategory1(categoryTree as any, 'Inscription')).toBeFalsy();
        expect(isGeometryCategory1(categoryTree as any, 'Project')).toBeFalsy();
        expect(isGeometryCategory1(categoryTree as any, 'Operation')).toBeTruthy();
    });
});
