import {ProjectCategoriesHelper} from '../../../../src/app/core/configuration/project-categories-helper';
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
