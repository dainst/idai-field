import {ProjectConfiguration} from '../../../../src/app/core/configuration/project-configuration';
import {Tree} from 'idai-field-core';


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

    const secondLevelCategory = {
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

        const configuration: ProjectConfiguration = new ProjectConfiguration([Tree.buildForest([[category, []]]), []]);

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

        const configuration: ProjectConfiguration = new ProjectConfiguration([Tree.buildForest([[ category, []]]), []]);

        expect(configuration.getFieldDefinitionLabel('T','aField')).toBe('aField');
    });


    it('should throw an error if field is not defined', () => {

        const configuration: ProjectConfiguration = new ProjectConfiguration([[], []]);

        expect(() => {
            configuration.getFieldDefinitionLabel('UndefinedCategory', 'someField');
        }).toThrow();
    });


    it('should let categories inherit fields from parent categories', () => {

        const configuration: ProjectConfiguration
            = new ProjectConfiguration([Tree.buildForest([[firstLevelCategory, []], [secondLevelCategory, []] ] as any), []]);
        const fields = configuration.getFieldDefinitions('SecondLevelCategory');

        expect(fields[0].name).toEqual('fieldA');
        expect(fields[1].name).toEqual('fieldB');
    });


    it('list parent category fields first', () => {

        const configuration: ProjectConfiguration
            = new ProjectConfiguration([Tree.buildForest([[secondLevelCategory, []], [firstLevelCategory, []]] as any), []]);
        const fields = configuration.getFieldDefinitions('SecondLevelCategory');

        expect(fields[0].name).toEqual('fieldA');
        expect(fields[1].name).toEqual('fieldB');
    });
});
