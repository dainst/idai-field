import {ProjectCategories} from '../../../../src/app/core/configuration/project-categories';
import isGeometryCategory = ProjectCategories.isGeometryCategory;
import getFieldCategories = ProjectCategories.getFieldCategories;
import {sameset} from 'tsfun';
import {Named, toName, Category, Tree, TreeList} from '@idai-field/core';
import getConcreteFieldCategories = ProjectCategories.getConcreteFieldCategories;
import getRegularCategoryNames = ProjectCategories.getRegularCategoryNames;
import getImageCategoryNames = ProjectCategories.getImageCategoryNames;
import getTypeCategories = ProjectCategories.getTypeCategories;
import getOverviewTopLevelCategories = ProjectCategories.getOverviewToplevelCategories;
import getOverviewCategoryNames = ProjectCategories.getOverviewCategoryNames;
import getOverviewCategories = ProjectCategories.getOverviewCategories;
import getFeatureCategoryNames = ProjectCategories.getFeatureCategoryNames;


describe('ProjectCategories', () => {

    const categoryTreelist: TreeList<Named> = Tree.buildList([
        [
            { name: 'Image' },
            [
                [
                    {name: 'Drawing'},
                    []
                ]
            ]
        ],
        [
            { name: 'Operation' },
            [
                [
                    {name: 'Trench'},
                    []
                ]
            ]
        ],
        [
            { name: 'Place' },
            []
        ],
        [
            {name: 'Inscription'},
            []
        ],
        [
            {name: 'Type'},
            []
        ],
        [
            {name: 'TypeCatalog'},
            []
        ],
        [
            {name: 'Project'},
            []
        ],
        [
            {name: 'Find'},
            []
        ],
        [
            {name: 'Feature'},
            [
                [
                    {name: 'Architecture'},
                    []
                ]
            ]
        ]
    ]);


    it('isGeometryCategory', () => {

        expect(isGeometryCategory(categoryTreelist, 'Image')).toBeFalsy();
        expect(isGeometryCategory(categoryTreelist, 'Drawing')).toBeFalsy();
        expect(isGeometryCategory(categoryTreelist, 'Type')).toBeFalsy();
        expect(isGeometryCategory(categoryTreelist, 'TypeCatalog')).toBeFalsy();
        expect(isGeometryCategory(categoryTreelist, 'Inscription')).toBeFalsy();
        expect(isGeometryCategory(categoryTreelist, 'Project')).toBeFalsy();
        expect(isGeometryCategory(categoryTreelist, 'Operation')).toBeTruthy();
        expect(isGeometryCategory(categoryTreelist, 'Project')).toBeFalsy();
    });


    it('getFieldCategories', () => {

        expect(
            sameset(
                getFieldCategories(categoryTreelist as TreeList<Category>).map(toName),
                ['Operation', 'Trench', 'Inscription', 'Type', 'TypeCatalog', 'Find', 'Place', 'Feature', 'Architecture'])
        ).toBeTruthy();
    });


    it('getConcreteFieldCategories', () => {

        expect(
            sameset(
                getConcreteFieldCategories(categoryTreelist as TreeList<Category>).map(toName),
                ['Operation', 'Trench', 'Inscription', 'Find', 'Place', 'Feature', 'Architecture'])
        ).toBeTruthy();
    });


    it('getRegularCategoryNames', () => {

        expect(
            sameset(
                getRegularCategoryNames(categoryTreelist as TreeList<Category>),
                ['Inscription', 'Find', 'Feature', 'Architecture'])
        ).toBeTruthy();
    });


    it('getImageCategoryNames', () => {

        expect(
            sameset(
                getImageCategoryNames(categoryTreelist as TreeList<Category>),
                ['Image', 'Drawing'])
        ).toBeTruthy();
    });


    it('getTypeCategories', () => {

        expect(
            sameset(
                getTypeCategories(categoryTreelist as TreeList<Category>).map(toName),
                ['TypeCatalog', 'Type'])
        ).toBeTruthy();
    });


    it('getOverviewToplevelCategories', () => {

        expect(
            sameset(
                getOverviewTopLevelCategories(categoryTreelist as TreeList<Category>).map(toName),
                ['Operation', 'Place'])
        ).toBeTruthy();
    });


    it('getOverviewCategories', () => {

        expect(
            sameset(
                getOverviewCategories(categoryTreelist as TreeList<Category>),
                ['Trench', 'Place'])
        ).toBeTruthy();
    });


    it('getOverviewCategoryNames', () => {

        expect(
            sameset(
                getOverviewCategoryNames(categoryTreelist as TreeList<Category>),
                ['Operation', 'Trench', 'Place'])
        ).toBeTruthy();
    });


    it('getFeatureCategoryNames', () => {

        expect(
            sameset(
                getFeatureCategoryNames(categoryTreelist as TreeList<Category>),
                ['Feature', 'Architecture'])
        ).toBeTruthy();
    });
});
