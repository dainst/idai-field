import { ProjectConfiguration } from '../../src/configuration/project-configuration';
import { Tree } from '../../src/tools';


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
