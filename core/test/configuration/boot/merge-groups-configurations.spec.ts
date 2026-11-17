import { mergeGroupsConfigurations } from '../../../src/configuration/boot/merge-groups-configurations';
import { BaseGroupDefinition } from '../../../src/configuration/model/form/base-form-definition';

/**
 * @author Thomas Kleinke
 */
describe('mergeGroupsConfigurations', () => {

    it('merge groups configurations', () => {

        const parentGroups: Array<BaseGroupDefinition> = [
            {
                name: 'group1',
                fields: ['fieldA', 'fieldB']
            },
            {
                name: 'group2',
                fields: ['fieldC']
            }
        ];

        const childGroups: Array<BaseGroupDefinition> = [
            {
                name: 'group1',
                fields: ['fieldD']
            },
            {
                name: 'group3',
                fields: ['fieldE', 'fieldF']
            }
        ];

        expect(mergeGroupsConfigurations(parentGroups, childGroups)).toEqual([
            {
                name: 'group1',
                fields: ['fieldA', 'fieldB', 'fieldD']
            },
            {
                name: 'group2',
                fields: ['fieldC']
            },
            {
                name: 'group3',
                fields: ['fieldE', 'fieldF']
            }
        ]);
    });


    it('allow overwriting field order in child group', () => {

        const parentGroups: Array<BaseGroupDefinition> = [
            {
                name: 'group1',
                fields: ['fieldA', 'fieldB', 'fieldC']
            }
        ];

        const childGroups: Array<BaseGroupDefinition> = [
            {
                name: 'group1',
                fields: ['fieldD', 'fieldB', 'fieldA', 'fieldC']
            }
        ];

        expect(mergeGroupsConfigurations(parentGroups, childGroups)).toEqual([
            {
                name: 'group1',
                fields: ['fieldD', 'fieldB', 'fieldA', 'fieldC']
            },
        ]);
    });
});
