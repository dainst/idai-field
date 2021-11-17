import { Field } from 'idai-field-core';
import { ConfigurationIndex } from '../../../../src/app/components/configuration/configuration-index';


describe('ConfigurationIndex', () => {

    it('find category forms', () => {

        const forms = [
            {
                name: 'A:default',
                label: { de: 'A' },
                defaultLabel: { de: 'A' },
                parentCategory: {
                    name: 'A:parent'
                }
            }
        ]
        const index = ConfigurationIndex.create(forms as any, [], []);

        const result = ConfigurationIndex.findCategoryForms(index, '', 'A:parent');
        expect(result[0].name).toEqual('A:default');
    });


    it('find fields', () => {

        const categories = [
            {
                name: 'A',
                label: {},
                description: {},
                fields: {
                    field1: {
                        name: 'field1',
                        inputType: Field.InputType.TEXT as Field.InputType,
                        label: {
                            de: 'Erstes Feld',
                            en: 'First field'
                        },
                        defaultLabel: {
                            de: 'Erstes Feld',
                            en: 'First field'
                        }
                    }
                }
            }
        ];
        const index = ConfigurationIndex.create([], categories, []);

        expect(ConfigurationIndex.findFields(index, 'field', 'A')[0].name).toEqual('field1');
        expect(ConfigurationIndex.findFields(index, 'field1', 'A')[0].name).toEqual('field1');
        expect(ConfigurationIndex.findFields(index, 'Erstes', 'A')[0].name).toEqual('field1');
        expect(ConfigurationIndex.findFields(index, 'First', 'A')[0].name).toEqual('field1');
        expect(ConfigurationIndex.findFields(index, 'Abc', 'A').length).toBe(0);
    });
});
