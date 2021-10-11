import { Map } from 'tsfun';
import { BuiltInFieldDefinition, LibraryFormDefinition, TransientFormDefinition } from '../../../src/configuration';
import { getAvailableForms } from '../../../src/configuration/boot/get-available-forms';
import { Relation } from '../../../src/model/configuration/relation';


/**
 * @author Thomas Kleinke
 */
describe('get available forms', () => {

    it('get available forms', () => {

        const builtInFields: Map<BuiltInFieldDefinition> = {
            builtInField: {
                inputType: 'boolean'
            }
        };

        const commonFields: Map<BuiltInFieldDefinition> = {
            commonField: {
                inputType: 'literature'
            }
        };

        const categories: any = {
            Category1: {
                fields: {
                    field1: {
                        inputType: 'input'
                    }
                },
                minimalForm: {
                    groups: [
                        {
                            name: 'group1',
                            fields: ['builtInField', 'isSameAs']
                        }
                    ]
                }
            },
            Category2: {
                parent: 'Category1',
                fields: {
                    field2: {
                        inputType: 'text'
                    }
                },
                minimalForm: {
                    groups: [
                        {
                            name: 'group1',
                            fields: ['commonField']
                        }
                    ]
                }
            },
            Category3: {    // Get minimal form from parent category
                parent: 'Category1',
                fields: {}
            }
        };

        const libraryForms: Map<LibraryFormDefinition> = {
            'Category2:default': {
                categoryName: 'Category2',
                description: {},
                createdBy: 'Test user',
                creationDate: '07-07-2021',
                groups: [
                    {
                        name: 'group1',
                        fields: ['field1']
                    },
                    {
                        name: 'group2',
                        fields: ['field2']
                    }
                ]
            }
        };

        const relations: Array<Relation> = [
            {
                name: 'isSameAs',
                domain: [],
                range: [],
                inputType: 'relation'
            }
        ];

        const result: Map<TransientFormDefinition> = getAvailableForms(
            categories, libraryForms, builtInFields, commonFields, relations
        );

        expect(Object.keys(result).length).toBe(4);

        expect(result['Category1'].name).toBe('Category1');
        expect(result['Category1'].categoryName).toBe('Category1');
        expect(result['Category1'].groups.length).toBe(1);
        expect(result['Category1'].groups[0].name).toBe('group1');
        expect(result['Category1'].groups[0].fields).toEqual(['builtInField', 'isSameAs']);
        expect(Object.keys(result['Category1'].fields).length).toBe(1);
        expect(result['Category1'].fields['builtInField'].inputType).toBe('boolean');

        expect(result['Category2'].name).toBe('Category2');
        expect(result['Category2'].categoryName).toBe('Category2');
        expect(result['Category2'].groups.length).toBe(1);
        expect(result['Category2'].groups[0].name).toBe('group1');
        expect(result['Category2'].groups[0].fields).toEqual(['commonField']);
        expect(Object.keys(result['Category2'].fields).length).toBe(2);
        expect(result['Category2'].fields['builtInField'].inputType).toBe('boolean');
        expect(result['Category2'].fields['commonField'].inputType).toBe('literature');

        expect(result['Category2:default'].name).toBe('Category2:default');
        expect(result['Category2:default'].categoryName).toBe('Category2');
        expect(result['Category2:default'].groups.length).toBe(2);
        expect(result['Category2:default'].groups[0].name).toBe('group1');
        expect(result['Category2:default'].groups[0].fields).toEqual(['field1']);
        expect(result['Category2:default'].groups[1].name).toBe('group2');
        expect(result['Category2:default'].groups[1].fields).toEqual(['field2']);
        expect(Object.keys(result['Category2:default'].fields).length).toBe(4);
        expect(result['Category2:default'].fields['builtInField'].inputType).toBe('boolean');
        expect(result['Category2:default'].fields['commonField'].inputType).toBe('literature');
        expect(result['Category2:default'].fields['field1'].inputType).toBe('input');
        expect(result['Category2:default'].fields['field2'].inputType).toBe('text');

        expect(result['Category3'].name).toBe('Category3');
        expect(result['Category3'].categoryName).toBe('Category3');
        expect(result['Category3'].groups.length).toBe(1);
        expect(result['Category3'].groups[0].name).toBe('group1');
        expect(result['Category3'].groups[0].fields).toEqual(['builtInField', 'isSameAs']);
        expect(Object.keys(result['Category3'].fields).length).toBe(1);
        expect(result['Category1'].fields['builtInField'].inputType).toBe('boolean');
    });
});
