import { Field, Valuelist } from 'idai-field-core';
import { ConfigurationIndex } from '../../../../src/app/services/configuration/index/configuration-index';


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
        const index = new ConfigurationIndex(undefined, undefined, undefined);
        index.createSubIndices(forms as any, [], [], [], []);

        expect(index.findCategoryForms( '', 'A:parent')[0].name).toEqual('A:default');
        expect(index.findCategoryForms('A', 'A:parent')[0].name).toEqual('A:default');
        expect(index.findCategoryForms('A:default', 'A:parent')[0].name).toEqual('A:default');
        expect(index.findCategoryForms('Kategorie', 'A:parent')[0].name).toEqual('A:default');
        expect(index.findCategoryForms('Category', 'A:parent')[0].name).toEqual('A:default');
        expect(index.findCategoryForms('default', 'A:parent')[0].name).toEqual('A:default');
        expect(index.findCategoryForms('XYZ', 'A:parent').length).toBe(0);
    });


    it('get children of category form', () => {

        const forms = [
            {
                name: 'A:default',
                label: {},
                defaultLabel: {},
                parentCategory: {
                    name: 'ParentA:default'
                }
            },
            {
                name: 'B:default',
                label: {},
                defaultLabel: {},
                parentCategory: {
                    name: 'ParentA:default'
                }
            },
            {
                name: 'C:default',
                label: {},
                defaultLabel: {},
            }
        ]
        const index = new ConfigurationIndex(undefined, undefined, undefined);
        index.createSubIndices(forms as any, [], [], [], []);

        const result = index.getCategoryFormChildren('ParentA:default');
        expect(result[0].name).toEqual('A:default');
        expect(result[1].name).toEqual('B:default');
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
        const index = new ConfigurationIndex(undefined, undefined, undefined);
        index.createSubIndices([], categories, [], [], []);

        expect(index.findFields('', 'A')[0].name).toEqual('field1');
        expect(index.findFields('field', 'A')[0].name).toEqual('field1');
        expect(index.findFields('field1', 'A')[0].name).toEqual('field1');
        expect(index.findFields('Erstes', 'A')[0].name).toEqual('field1');
        expect(index.findFields('Feld', 'A')[0].name).toEqual('field1');
        expect(index.findFields('First', 'A')[0].name).toEqual('field1');
        expect(index.findFields('field', 'A')[0].name).toEqual('field1');
        expect(index.findFields('Abc', 'A').length).toBe(0);
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
        const index = new ConfigurationIndex(undefined, undefined, undefined);
        index.createSubIndices([], [], [], valuelists, []);

        expect(index.findValuelists('')[0].id).toEqual('valuelist-1');
        expect(index.findValuelists('valuelist')[0].id).toEqual('valuelist-1');
        expect(index.findValuelists('valuelist-1')[0].id).toEqual('valuelist-1');
        expect(index.findValuelists('value1')[0].id).toEqual('valuelist-1');
        expect(index.findValuelists('Wert')[0].id).toEqual('valuelist-1');
        expect(index.findValuelists('Wert 1')[0].id).toEqual('valuelist-1');
        expect(index.findValuelists('Value')[0].id).toEqual('valuelist-1');
        expect(index.findValuelists('Value 1')[0].id).toEqual('valuelist-1');
        expect(index.findValuelists('no-label-value')[0].id).toEqual('valuelist-1');
        expect(index.findValuelists('label')[0].id).toEqual('valuelist-1');
        expect(index.findValuelists('Abc').length).toBe(0);
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

        const index = new ConfigurationIndex(undefined, undefined, undefined);
        index.createSubIndices([], [], [], valuelists, [category1, category2]);

        const result1 = index.getValuelistUsage('valuelist-1');
        expect(result1[0].category).toBe(category1);
        expect(result1[0].fields[0].name).toBe('field1-1');
        expect(result1[1].category).toBe(category2);
        expect(result1[1].fields[0].name).toBe('field2-1');

        const result2 = index.getValuelistUsage('valuelist-2');
        expect(result2[0].category).toBe(category1);
        expect(result2[0].fields[0].name).toBe('field1-2');
        expect(result2[0].fields[1].name).toBe('field1-3');
    });
});
