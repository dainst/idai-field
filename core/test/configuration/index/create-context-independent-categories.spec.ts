import { createContextIndependentCategories } from '../../../src/configuration/index/create-context-independent-categories';
import { FieldDefinition } from '../../../src/model/field-definition';


describe('createContextIndependentCategories', () => {

    xit('base case', () => {
    
        const result = createContextIndependentCategories(
            {
                Find: { 
                    supercategory: true,
                    groups: [],
                    fields: {
                        identifier: { 
                            inputType: FieldDefinition.InputType.INPUT,
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
                    fields: { a: { inputType: FieldDefinition.InputType.INPUT },
                              c: { inputType: FieldDefinition.InputType.INPUT } },
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
                    fields: { b: { inputType: FieldDefinition.InputType.INPUT },
                              c: { inputType: FieldDefinition.InputType.INPUT } },
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
                        }
                    }
                ]
            }
        );

        expect(result[0].groups[0].name).toEqual('group-a');
        expect(result[1].groups[0].name).toEqual('group-b');
    });
});
