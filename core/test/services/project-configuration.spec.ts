import { sameset } from 'tsfun';
import { ProjectConfiguration } from '../../src/services/project-configuration';
import { Forest, Named } from '../../src/tools';


describe('ProjectConfiguration', () => {

    const projectConfiguration = new ProjectConfiguration({
        forms: Forest.build([
            [
                { name: 'Image', groups: [] },
                [
                    [
                        { name: 'Drawing', groups: [] },
                        []
                    ]
                ]
            ],
            [
                {
                    name: 'Operation',
                    groups: [{ name: 'default', fields: [{ name: 'geometry' }] }]
                },
                [
                    [
                        {
                            name: 'Trench',
                            groups: [{ name: 'default', fields: [{ name: 'geometry' }] }]
                        },
                        []
                    ]
                ]
            ],
            [
                {
                    name: 'Place',
                    groups: [{ name: 'default', fields: [{ name: 'geometry' }] }]
                },
                []
            ],
            [
                {
                    name: 'Inscription',
                    groups: [{ name: 'default', fields: [{ name: 'description' }] }]
                },
                []
            ],
            [
                {
                    name: 'Type',
                    groups: []
                },
                []
            ],
            [
                {
                    name: 'TypeCatalog',
                    groups: []
                },
                []
            ],
            [
                {
                    name: 'Project',
                    groups: []
                },
                []
            ],
            [
                {
                    name: 'Find',
                    groups: [{ name: 'default', fields: [{ name: 'geometry' }] }]
                },
                []
            ],
            [
                {
                    name: 'Feature',
                    groups: [{ name: 'default', fields: [{ name: 'geometry' }] }]
                },
                [
                    [
                        {
                            name: 'Architecture',
                            groups: [{ name: 'default', fields: [{ name: 'geometry' }] }]
                        },
                        []
                    ]
                ]
            ]
        ]) as any,
        categories: {},
        relations: [],
        commonFields: {},
        valuelists: {},
        projectLanguages: []
    });


    it('isGeometryCategory', () => {

        expect(projectConfiguration.isGeometryCategory('Image')).toBeFalsy();
        expect(projectConfiguration.isGeometryCategory('Drawing')).toBeFalsy();
        expect(projectConfiguration.isGeometryCategory('Type')).toBeFalsy();
        expect(projectConfiguration.isGeometryCategory('TypeCatalog')).toBeFalsy();
        expect(projectConfiguration.isGeometryCategory('Inscription')).toBeFalsy();
        expect(projectConfiguration.isGeometryCategory('Project')).toBeFalsy();
        expect(projectConfiguration.isGeometryCategory('Project')).toBeFalsy();
        expect(projectConfiguration.isGeometryCategory('Operation')).toBeTruthy();
        expect(projectConfiguration.isGeometryCategory('Find')).toBeTruthy();
        expect(projectConfiguration.isGeometryCategory('Feature')).toBeTruthy();
    });


    it('getConcreteFieldCategories', () => {

        expect(
            sameset(
                projectConfiguration.getFieldCategories().map(Named.toName),
                ['Operation', 'Trench', 'Inscription', 'Find', 'Place', 'Feature', 'Architecture'])
        ).toBeTruthy();
    });


    it('getRegularCategoryNames', () => {

        expect(
            sameset(
                projectConfiguration.getRegularCategories().map(Named.toName),
                ['Inscription', 'Find', 'Feature', 'Architecture'])
        ).toBeTruthy();
    });


    it('getImageCategoryNames', () => {

        expect(
            sameset(
                projectConfiguration.getImageCategories().map(Named.toName),
                ['Image', 'Drawing'])
        ).toBeTruthy();
    });


    it('getTypeManagementCategories', () => {

        expect(
            sameset(
                projectConfiguration.getTypeManagementCategories().map(Named.toName),
                ['TypeCatalog', 'Type'])
        ).toBeTruthy();
    });


    it('getOverviewToplevelCategories', () => {

        expect(
            sameset(
                projectConfiguration.getOverviewSupercategories().map(Named.toName),
                ['Operation', 'Place'])
        ).toBeTruthy();
    });


    it('getOverviewConcreteOverviewCategories', () => {

        expect(
            sameset(
                projectConfiguration.getConcreteOverviewCategories().map(Named.toName),
                ['Trench', 'Place'])
        ).toBeTruthy();
    });


    it('getOverviewCategories', () => {

        expect(
            sameset(
                projectConfiguration.getOverviewCategories().map(Named.toName),
                ['Operation', 'Trench', 'Place'])
        ).toBeTruthy();
    });


    it('getFeatureCategories', () => {

        expect(
            sameset(
                projectConfiguration.getFeatureCategories().map(Named.toName),
                ['Feature', 'Architecture'])
        ).toBeTruthy();
    });
});
