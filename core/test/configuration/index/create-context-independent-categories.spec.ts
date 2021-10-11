import { createContextIndependentCategories } from '../../../src/configuration/index/create-context-independent-categories';
import { Field } from '../../../src/model/configuration/field';


describe('createContextIndependentCategories', () => {

    it('base case', () => {
    
        const result = createContextIndependentCategories(
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
            {},
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
                        groups: {
                            'group-a': 'Group-a',
                            'group-b': 'Group-b'
                        }
                    }
                ]
            }
        );

        expect(result.length).toBe(6);

        expect(result[0].name).toEqual('Find');
        expect(result[0].libraryId).toEqual('Find');

        expect(result[1].name).toEqual('Find');
        expect(result[1].libraryId).toEqual('Find:a');

        expect(result[2].name).toEqual('Pottery');
        expect(result[2].libraryId).toEqual('Pottery');
        expect(result[2].parentCategory.libraryId).toEqual('Find:a');

        expect(result[3].name).toEqual('Pottery');
        expect(result[3].libraryId).toEqual('Pottery:a');
        expect(result[3].parentCategory.libraryId).toEqual('Find:a');
        expect(result[3].groups[0].name).toEqual('group-a');
        expect(result[3].groups[0].label['de']).toEqual('Group-a');

        expect(result[4].name).toEqual('Pottery');
        expect(result[4].libraryId).toEqual('Pottery:b');
        expect(result[4].parentCategory.libraryId).toEqual('Find:a');
        expect(result[4].groups[0].name).toEqual('group-b');
        expect(result[4].groups[0].label['de']).toEqual('Group-b');

        expect(result[5].name).toEqual('Find');
        expect(result[5].libraryId).toEqual('Find:b');
    });
});
