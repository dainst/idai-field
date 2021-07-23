import { createContextIndependentCategories } from '../../../src/configuration/index/create-context-independent-categories';
import { Field } from '../../../src/model';


describe('createContextIndependentCategories', () => {

    it('base case', () => {
    
        const result = createContextIndependentCategories(
            {
                Find: { 
                    supercategory: true,
                    userDefinedSubcategoriesAllowed: true,
                    groups: [],
                    fields: {
                        identifier: { 
                            inputType: Field.InputType.INPUT,
                        }
                    }
                }
            },
            [],
            {
                'Find:a': {
                    categoryName: 'Find',
                    groups: [],
                    fields: {},
                    createdBy: '',
                    creationDate: '',
                    description: {},
                    valuelists: {},
                    commons: []
                },
                'Find:b': {
                    categoryName: 'Find',
                    groups: [],
                    fields: {},
                    createdBy: '',
                    creationDate: '',
                    description: {},
                    valuelists: {},
                    commons: []
                },
                'Pottery:a': {
                    categoryName: 'Pottery',
                    parent: 'Find',
                    groups: [{ name: 'group-a', fields: ['a', 'c'] }],
                    fields: { a: { inputType: Field.InputType.INPUT },
                              c: { inputType: Field.InputType.INPUT } },
                    createdBy: '',
                    creationDate: '',
                    description: {},
                    valuelists: {},
                    commons: []
                },
                'Pottery:b': {
                    categoryName: 'Pottery',
                    parent: 'Find',
                    groups: [{ name: 'group-b', fields: ['c', 'b'] }],
                    fields: { b: { inputType: Field.InputType.INPUT },
                              c: { inputType: Field.InputType.INPUT } },
                    createdBy: '',
                    creationDate: '',
                    description: {},
                    valuelists: {},
                    commons: []
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

        expect(result.length).toBe(5);

        expect(result[0].name).toEqual('Find');
        expect(result[0].libraryId).toEqual('Find');

        expect(result[1].name).toEqual('Find');
        expect(result[1].libraryId).toEqual('Find:a');

        expect(result[2].name).toEqual('Pottery');
        expect(result[2].libraryId).toEqual('Pottery:a');
        expect(result[2].parentCategory.libraryId).toEqual('Find:a');
        expect(result[2].groups[0].name).toEqual('group-a');
        expect(result[2].groups[0].label['de']).toEqual('Group-a');

        expect(result[3].name).toEqual('Pottery');
        expect(result[3].libraryId).toEqual('Pottery:b');
        expect(result[3].parentCategory.libraryId).toEqual('Find:a');
        expect(result[3].groups[0].name).toEqual('group-b');
        expect(result[3].groups[0].label['de']).toEqual('Group-b');

        expect(result[4].name).toEqual('Find');
        expect(result[4].libraryId).toEqual('Find:b');
    });
});
