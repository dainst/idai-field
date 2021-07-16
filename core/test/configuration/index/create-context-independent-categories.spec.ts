import { createContextIndependentCategories } from '../../../src/configuration/index/create-context-independent-categories';
import { Field } from '../../../src/model';


describe('createContextIndependentCategories', () => {

    it('base case', () => {
    
        const result = createContextIndependentCategories(
            {
                Find: { 
                    supercategory: true,
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
                'Find:default': { // This should be selected // TODO implement, currently the default Find is selected
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

        expect(result[0].groups[0].name).toEqual('group-a');
        expect(result[0].groups[0].label['de']).toEqual('Group-a');
        expect(result[1].groups[0].name).toEqual('group-b');
        expect(result[1].groups[0].label['de']).toEqual('Group-b');
    });
});
