import {createContextIndependentCategories} from '../../../src/configuration/index/create-context-independent-categories';
import {FieldDefinition} from '../../../src/model/field-definition';
import {Tree} from '../../../src/tools/forest';

describe('createContextIndependentCategories', () => {

    it('base case', () => {
    
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
            {
                'Find:default': { // This will be filtered out
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
                    groups: [],
                    fields: { a: { inputType: FieldDefinition.InputType.INPUT } },
                    createdBy: '',
                    creationDate: '',
                    description: {},
                    valuelists: {},
                    commons: []
                },
                'Pottery:b': {
                    categoryName: 'Pottery',
                    parent: 'Find',
                    groups: [],
                    fields: { b: { inputType: FieldDefinition.InputType.INPUT } },
                    createdBy: '',
                    creationDate: '',
                    description: {},
                    valuelists: {},
                    commons: []
                }
            },
            {
                de: [{
                    categories: { 
                        Find: { label: 'Fund', fields: { identifier: { label: 'Identifier'} } },
                        Pottery: { label: 'Keramik', fields: { a: { label: 'A' }, b: { label: 'B' }} } 
                    }  
                }]
            }
        
        );

        const res = Tree.flatten(result);
        for (const r of res) {
            // console.log(r.name);
            // console.log(JSON.stringify(r.groups));
        }
    });
});