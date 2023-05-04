import { createRawLibraryConfiguration } from '../../../src/configuration/index/create-raw-library-configuration';
import { Field } from '../../../src/model/configuration/field';
import { Tree } from '../../../src/tools/forest';


describe('createRawLibraryConfiguration', () => {

    it('base case', () => {
    
        const result = createRawLibraryConfiguration(
            {
                Find: { 
                    supercategory: true,
                    userDefinedSubcategoriesAllowed: true,
                    minimalForm: {
                        groups: [{ name: 'group-a', fields: ['identifier'] }]
                    },
                    fields: {
                        identifier: { 
                            inputType: Field.InputType.INPUT,
                        }
                    }
                }
            },
            {
                Pottery: {
                    parent: 'Find',
                    fields: {
                        a: { inputType: Field.InputType.INPUT },
                        b: { inputType: Field.InputType.INPUT },
                        c: { inputType: Field.InputType.INPUT }
                    },
                    description: {},
                    minimalForm: {
                        groups: []
                    } as any
                }
            },
            [],
            {
                'Find:a': {
                    categoryName: 'Find',
                    groups: [],
                    createdBy: '',
                    creationDate: '',
                    description: {},
                    valuelists: {}
                },
                'Find:b': {
                    categoryName: 'Find',
                    groups: [],
                    createdBy: '',
                    creationDate: '',
                    description: {},
                    valuelists: {}
                },
                'Pottery:a': {
                    categoryName: 'Pottery',
                    groups: [{ name: 'group-a', fields: ['identifier', 'a', 'c'] }],
                    createdBy: '',
                    creationDate: '',
                    description: {},
                    valuelists: {}
                },
                'Pottery:b': {
                    categoryName: 'Pottery',
                    groups: [{ name: 'group-b', fields: ['identifier', 'c', 'b'] }],
                    createdBy: '',
                    creationDate: '',
                    description: {},
                    valuelists: {}
                }
            },
            {},
            {},
            {
                'valuelist-1': {
                    description: {},
                    createdBy: '',
                    creationDate: '',
                    values: {
                        'a': {}
                    }
                }
            },
            {
                'valuelist-2': {
                    description: {},
                    createdBy: '',
                    creationDate: '',
                    values: {
                        'b': {}
                    }
                }
            },
            ['Find:a'],
            {
                de: [
                    // core - language conf
                    {
                        categories: { 
                            Find: { 
                                label: 'Fund', 
                                fields: { 
                                    identifier: { label: 'Identifier' } 
                                } 
                            },
                        }
                    }, 
                    // library - language conf
                    {
                        categories: {
                            Pottery: { 
                                label: 'Keramik', 
                                fields: { 
                                    a: { label: 'A' }, 
                                    b: { label: 'B' }, 
                                    c: { label: 'C' }} 
                                } 
                        },
                        forms: {
                            'Find:a': {
                                label: 'Fund (Formular A)'
                            }
                        },
                        groups: {
                            'group-a': 'Group-a',
                            'group-b': 'Group-b'
                        }
                    }
                ]
            }
        );

        const forms = Tree.flatten(result.forms);

        expect(forms.length).toBe(6);

        expect(forms[0].name).toEqual('Find');
        expect(forms[0].libraryId).toEqual('Find');
        expect(forms[0].label.de).toEqual('Fund');

        expect(forms[1].name).toEqual('Find');
        expect(forms[1].libraryId).toEqual('Find:a');
        expect(forms[1].label.de).toEqual('Fund (Formular A)');

        expect(forms[2].name).toEqual('Pottery');
        expect(forms[2].libraryId).toEqual('Pottery');
        expect(forms[2].parentCategory.libraryId).toEqual('Find:a');
        expect(forms[2].label.de).toEqual('Keramik');

        expect(forms[3].name).toEqual('Pottery');
        expect(forms[3].libraryId).toEqual('Pottery:a');
        expect(forms[3].parentCategory.libraryId).toEqual('Find:a');
        expect(forms[3].label.de).toEqual('Keramik');
        expect(forms[3].groups[0].name).toEqual('group-a');
        expect(forms[3].groups[0].label.de).toEqual('Group-a');

        expect(forms[4].name).toEqual('Pottery');
        expect(forms[4].libraryId).toEqual('Pottery:b');
        expect(forms[4].parentCategory.libraryId).toEqual('Find:a');
        expect(forms[4].label.de).toEqual('Keramik');
        expect(forms[4].groups[0].name).toEqual('group-b');
        expect(forms[4].groups[0].label.de).toEqual('Group-b');

        expect(forms[5].name).toEqual('Find');
        expect(forms[5].libraryId).toEqual('Find:b');
        expect(forms[5].label.de).toEqual('Fund');

        expect(result.valuelists['valuelist-1'].values['a']).toBeDefined();
        expect(result.valuelists['valuelist-2'].values['b']).toBeDefined();
    });
});
