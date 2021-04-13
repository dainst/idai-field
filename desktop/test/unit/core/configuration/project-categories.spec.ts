import {ProjectCategories} from '../../../../src/app/core/configuration/project-categories';
import isGeometryCategory = ProjectCategories.isGeometryCategory;
import getFieldCategories = ProjectCategories.getFieldCategories;
import {sameset} from 'tsfun';
import {Named, Category, Tree, Forest} from 'idai-field-core';
import getConcreteFieldCategories = ProjectCategories.getConcreteFieldCategories;
import getRegularCategoryNames = ProjectCategories.getRegularCategoryNames;
import getImageCategoryNames = ProjectCategories.getImageCategoryNames;
import getTypeCategories = ProjectCategories.getTypeCategories;
import getOverviewTopLevelCategories = ProjectCategories.getOverviewToplevelCategories;
import getOverviewCategoryNames = ProjectCategories.getOverviewCategoryNames;
import getOverviewCategories = ProjectCategories.getOverviewCategories;
import getFeatureCategoryNames = ProjectCategories.getFeatureCategoryNames;


describe('ProjectCategories', () => {

    const categoryForest: Forest<Named> = Tree.buildForest([
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

        expect(isGeometryCategory(categoryForest, 'Image')).toBeFalsy();
        expect(isGeometryCategory(categoryForest, 'Drawing')).toBeFalsy();
        expect(isGeometryCategory(categoryForest, 'Type')).toBeFalsy();
        expect(isGeometryCategory(categoryForest, 'TypeCatalog')).toBeFalsy();
        expect(isGeometryCategory(categoryForest, 'Inscription')).toBeFalsy();
        expect(isGeometryCategory(categoryForest, 'Project')).toBeFalsy();
        expect(isGeometryCategory(categoryForest, 'Operation')).toBeTruthy();
        expect(isGeometryCategory(categoryForest, 'Project')).toBeFalsy();
    });


    it('getFieldCategories', () => {

        expect(
            sameset(
                getFieldCategories(categoryForest as Forest<Category>).map(Named.toName),
                ['Operation', 'Trench', 'Inscription', 'Type', 'TypeCatalog', 'Find', 'Place', 'Feature', 'Architecture'])
        ).toBeTruthy();
    });


    it('getConcreteFieldCategories', () => {

        expect(
            sameset(
                getConcreteFieldCategories(categoryForest as Forest<Category>).map(Named.toName),
                ['Operation', 'Trench', 'Inscription', 'Find', 'Place', 'Feature', 'Architecture'])
        ).toBeTruthy();
    });


    it('getRegularCategoryNames', () => {

        expect(
            sameset(
                getRegularCategoryNames(categoryForest as Forest<Category>),
                ['Inscription', 'Find', 'Feature', 'Architecture'])
        ).toBeTruthy();
    });


    it('getImageCategoryNames', () => {

        expect(
            sameset(
                getImageCategoryNames(categoryForest as Forest<Category>),
                ['Image', 'Drawing'])
        ).toBeTruthy();
    });


    it('getTypeCategories', () => {

        expect(
            sameset(
                getTypeCategories(categoryForest as Forest<Category>).map(Named.toName),
                ['TypeCatalog', 'Type'])
        ).toBeTruthy();
    });


    it('getOverviewToplevelCategories', () => {

        expect(
            sameset(
                getOverviewTopLevelCategories(categoryForest as Forest<Category>).map(Named.toName),
                ['Operation', 'Place'])
        ).toBeTruthy();
    });


    it('getOverviewCategories', () => {

        expect(
            sameset(
                getOverviewCategories(categoryForest as Forest<Category>),
                ['Trench', 'Place'])
        ).toBeTruthy();
    });


    it('getOverviewCategoryNames', () => {

        expect(
            sameset(
                getOverviewCategoryNames(categoryForest as Forest<Category>),
                ['Operation', 'Trench', 'Place'])
        ).toBeTruthy();
    });


    it('getFeatureCategoryNames', () => {

        expect(
            sameset(
                getFeatureCategoryNames(categoryForest as Forest<Category>),
                ['Feature', 'Architecture'])
        ).toBeTruthy();
    });
});
