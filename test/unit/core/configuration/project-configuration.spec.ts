import {MDInternal} from 'idai-components-2';
import {ProjectConfiguration} from '../../../../app/core/configuration/project-configuration';


/**
 * @author Daniel de Oliveira
 * @author Thomas Kleinke
 */
describe('ProjectConfiguration', () => {

    const firstLevelCategory = {
        name: 'FirstLevelCategory',
        groups: [{
            name: 'stem',
            fields:
                {
                    name: 'fieldA',
                    label: 'Field A',
                    inputType: 'text'
                }
        }]
    };

    const secondLevelCategory1 = {
        name: 'SecondLevelCategory',
        parent: 'FirstLevelCategory',
        groups: [{
            name: 'stem',
            fields: [
                {
                    name: 'fieldA'
                },
                {
                    name: 'fieldB'
                }]
        }]
    };


    const secondLevelCategory2 = {
        name: 'SecondLevelCategory',
        parent: 'FirstLevelCategory',
        groups: [{
            name: 'stem',
            fields: [{
                name: 'fieldA',
                inputType: 'unsignedFloat'
            }]
        }]
    };


    it('should get label for category', () => {

        const category = {
            name: 'T',
            groups: [{
                name: 'A',
                fields: [{
                    name: 'aField',
                    label: 'A Field'
                }]
            }]
        } as any;

        const configuration: ProjectConfiguration = new ProjectConfiguration([{T: category }, []]);

        expect(configuration.getFieldDefinitionLabel('T','aField')).toBe('A Field');
    });


    it('should get default label if not defined', () => {

        const category = {
            name: 'T',
            groups: [{
                fields: [{
                    name: 'aField'
                }]
            }]
        } as any;

        const configuration: ProjectConfiguration = new ProjectConfiguration([{ T: category }, []]);

        expect(configuration.getFieldDefinitionLabel('T','aField')).toBe('aField');
    });


    it('should throw an error if field is not defined', () => {

        const configuration: ProjectConfiguration = new ProjectConfiguration({ categories: {} } as any);

        expect(() => {
            configuration.getFieldDefinitionLabel('UndefinedCategory','someField');
        }).toThrow();
    });


    it('should let categories inherit fields from parent categories', () => {

        const configuration: ProjectConfiguration
            = new ProjectConfiguration([{ FirstLevelCategory: firstLevelCategory, SecondLevelCategory: secondLevelCategory1 } as any, []]);
        const fields = configuration.getFieldDefinitions('SecondLevelCategory');

        expect(fields[0].name).toEqual('fieldA');
        expect(fields[1].name).toEqual('fieldB');
    });


    it('list parent category fields first', () => {

        const configuration: ProjectConfiguration
            = new ProjectConfiguration([{SecondLevelCategory: secondLevelCategory1, FirstLevelCategory: firstLevelCategory} as any, []]);
        const fields = configuration.getFieldDefinitions('SecondLevelCategory');

        expect(fields[0].name).toEqual('fieldA');
        expect(fields[1].name).toEqual('fieldB');
    });


    xit('should fail if parent category is not defined', () => { // TODO move test to buildCategories

        expect(() => {
            new ProjectConfiguration({ categories: { SecondLevelCategory: secondLevelCategory1 } } as any);
        }).toThrow(MDInternal.PROJECT_CONFIGURATION_ERROR_GENERIC);
    });


    xit('should merge child field with parent field of the same name', () => {

        const configuration: ProjectConfiguration
            = new ProjectConfiguration({ categories: [secondLevelCategory2, firstLevelCategory]} as any);
        const fields = configuration.getFieldDefinitions('SecondLevelCategory');

        expect(fields.length).toBe(1);
        expect(fields[0].inputType).toEqual('unsignedFloat');
        expect(fields[0].label).toEqual('Field A');
    });


    xit('should only modify field in child', () => {

        const firstLevelCategory = {
            type: 'FirstLevelCategory',
            fields: [
                {
                    name: 'fieldA',
                    label: 'Field A',
                    inputType: 'text'
                }
            ]
        };

        const secondLevelCategory = {
            type: 'SecondLevelCategory',
            parent: 'FirstLevelCategory',
            fields: [
                {
                    name: 'fieldA',
                    label: 'Field A1'
                }
            ]
        };

        const configuration: ProjectConfiguration
            = new ProjectConfiguration({ categories: [firstLevelCategory, secondLevelCategory] } as any);
        const firstLevelCategoryFields = configuration.getFieldDefinitions('FirstLevelCategory');
        const secondLevelCategoryFields = configuration.getFieldDefinitions('SecondLevelCategory');

        expect(secondLevelCategoryFields[0].label).toEqual('Field A1');

        // there has a bug where the parent fields label has been overwritten, so it was "Field A1", too
        expect(firstLevelCategoryFields[0].label).toEqual('Field A');
    });

    // err cases

    xit('should reject a field with the same name as a parent field', () => { // TODO move to build categories

        const firstLevelCategory = {
            name: 'FirstLevelCategory',
            fields: [
                {
                    name: 'fieldA',
                    label: 'Field A',
                    inputType: 'text'
                }
            ]
        };

        const secondLevelCategory = {
            name: 'SecondLevelCategory',
            parent: 'FirstLevelCategory',
            fields: [
                {
                    name: 'fieldA',
                    label: 'Field A1'
                }
            ]
        };

        expect(
            () => new ProjectConfiguration({ categories: [firstLevelCategory, secondLevelCategory]} as any)
        ).toThrow([[
            'tried to overwrite field of parent category', 'fieldA', 'FirstLevelCategory', 'SecondLevelCategory'
        ]]);
    });
});
