import {ProjectCategoriesHelper} from '../../../../src/app/core/configuration/project-categories-helper';
import isGeometryCategory = ProjectCategoriesHelper.isGeometryCategory;
import getFieldCategories = ProjectCategoriesHelper.getFieldCategories;
import {categoryTreelistToMap} from '../../../../src/app/core/configuration/category-treelist';
import {to} from 'tsfun';
import {Named} from '../../../../src/app/core/util/named';


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
        [
            { name: 'Project' },
            []
        ]
    ];


    it('isGeometryCategory', () => {

        expect(isGeometryCategory(categoryTree as any, 'Image')).toBeFalsy();
        expect(isGeometryCategory(categoryTree as any, 'Drawing')).toBeFalsy();
        expect(isGeometryCategory(categoryTree as any, 'Type')).toBeFalsy();
        expect(isGeometryCategory(categoryTree as any, 'TypeCatalog')).toBeFalsy();
        expect(isGeometryCategory(categoryTree as any, 'Inscription')).toBeFalsy();
        expect(isGeometryCategory(categoryTree as any, 'Project')).toBeFalsy();
        expect(isGeometryCategory(categoryTree as any, 'Operation')).toBeTruthy();
        expect(isGeometryCategory(categoryTree as any, 'Project')).toBeFalsy();
    });


    it('getFieldCategories', () => {

        expect(
            getFieldCategories(categoryTreelistToMap(categoryTree as any)).map(to(Named.NAME))
        ).toEqual(['Drawing', 'Operation', 'Inscription', 'Type', 'TypeCatalog']);
    });
});
