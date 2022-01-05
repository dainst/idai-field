import { Field, Valuelist } from 'idai-field-core';
import { ConfigurationIndex } from '../../../../src/app/components/configuration/index/configuration-index';


describe('ConfigurationIndex', () => {

    it('find category forms', () => {

        const forms = [
            {
                name: 'A:default',
                label: {
                    de: 'Kategorie A',
                    en: 'Category A',
                },
                defaultLabel: {
                    de: 'Kategorie A',
                    en: 'Category A',
                },
                parentCategory: {
                    name: 'A:parent'
                }
            }
        ]
        const index = ConfigurationIndex.create(forms as any, [], [], [], []);

        expect(ConfigurationIndex.findCategoryForms(index, '', 'A:parent')[0].name).toEqual('A:default');
        expect(ConfigurationIndex.findCategoryForms(index, 'A', 'A:parent')[0].name).toEqual('A:default');
        expect(ConfigurationIndex.findCategoryForms(index, 'A:default', 'A:parent')[0].name).toEqual('A:default');
        expect(ConfigurationIndex.findCategoryForms(index, 'Kategorie', 'A:parent')[0].name).toEqual('A:default');
        expect(ConfigurationIndex.findCategoryForms(index, 'Category', 'A:parent')[0].name).toEqual('A:default');
        expect(ConfigurationIndex.findCategoryForms(index, 'default', 'A:parent')[0].name).toEqual('A:default');
        expect(ConfigurationIndex.findCategoryForms(index, 'XYZ', 'A:parent').length).toBe(0);
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
        const index = ConfigurationIndex.create([], categories, [], [], []);

        expect(ConfigurationIndex.findFields(index, '', 'A')[0].name).toEqual('field1');
        expect(ConfigurationIndex.findFields(index, 'field', 'A')[0].name).toEqual('field1');
        expect(ConfigurationIndex.findFields(index, 'field1', 'A')[0].name).toEqual('field1');
        expect(ConfigurationIndex.findFields(index, 'Erstes', 'A')[0].name).toEqual('field1');
        expect(ConfigurationIndex.findFields(index, 'Feld', 'A')[0].name).toEqual('field1');
        expect(ConfigurationIndex.findFields(index, 'First', 'A')[0].name).toEqual('field1');
        expect(ConfigurationIndex.findFields(index, 'field', 'A')[0].name).toEqual('field1');
        expect(ConfigurationIndex.findFields(index, 'Abc', 'A').length).toBe(0);
    });


   it('find valuelists', () => {

        const valuelists: Array<Valuelist> = [
            {
                id: 'valuelist-1',
                values: {
                    'value1': {
                        label: { de: 'Wert 1', en: 'Value 1' }
                    },
                    'no-label-value': {}
                }
            }
        ];
        const index = ConfigurationIndex.create([], [], [], valuelists, []);

        expect(ConfigurationIndex.findValuelists(index, '')[0].id).toEqual('valuelist-1');
        expect(ConfigurationIndex.findValuelists(index, 'valuelist')[0].id).toEqual('valuelist-1');
        expect(ConfigurationIndex.findValuelists(index, 'valuelist-1')[0].id).toEqual('valuelist-1');
        expect(ConfigurationIndex.findValuelists(index, 'value1')[0].id).toEqual('valuelist-1');
        expect(ConfigurationIndex.findValuelists(index, 'Wert')[0].id).toEqual('valuelist-1');
        expect(ConfigurationIndex.findValuelists(index, 'Wert 1')[0].id).toEqual('valuelist-1');
        expect(ConfigurationIndex.findValuelists(index, 'Value')[0].id).toEqual('valuelist-1');
        expect(ConfigurationIndex.findValuelists(index, 'Value 1')[0].id).toEqual('valuelist-1');
        expect(ConfigurationIndex.findValuelists(index, 'no-label-value')[0].id).toEqual('valuelist-1');
        expect(ConfigurationIndex.findValuelists(index, 'label')[0].id).toEqual('valuelist-1');
        expect(ConfigurationIndex.findValuelists(index, 'Abc').length).toBe(0);
    });


    it('get valuelist usage', () => {

        const valuelists: Array<Valuelist> = [
            {
                id: 'valuelist-1',
                values: {}
            },
            {
                id: 'valuelist-2',
                values: {}
            }
        ];

        const category1: any = {
            name: 'Category1',
            groups: [
                {
                    name: 'group',
                    fields: [
                        { name: 'field1-1', valuelist: { id: 'valuelist-1' } },
                        { name: 'field1-2', valuelist: { id: 'valuelist-2' } },
                        { name: 'field1-3', valuelist: { id: 'valuelist-2' } }
                    ]
                }
            ]
        };

        const category2: any = {
            name: 'Category2',
            groups: [
                {
                    name: 'group',
                    fields: [
                        { name: 'field2-1', valuelist: { id: 'valuelist-1' } }
                    ]
                }
            ]
        };

        const index = ConfigurationIndex.create([], [], [], valuelists, [category1, category2]);

        expect(ConfigurationIndex.getValuelistUsage(index, 'valuelist-1')).toEqual([
            { category: category1, fields: ['field1-1'] },
            { category: category2, fields: ['field2-1'] }
        ]);

        expect(ConfigurationIndex.getValuelistUsage(index, 'valuelist-2')).toEqual([
            { category: category1, fields: ['field1-2', 'field1-3'] }
        ]);
    });
});
