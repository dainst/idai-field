import {createContextIndependentCategories} from '../../../src/configuration/index/create-context-independent-categories';

describe('createContextIndependentCategories', () => {

    it('base case', () => {
    
        const result = createContextIndependentCategories(
            {
                Find: { 
                    supercategory: true,
                    groups: [],
                    fields: {}
                }
            },
            {
                'Find:default': {
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
                    fields: {},
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
                    fields: {},
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
                        Find: { label: 'Fund' },
                        Pottery: { label: 'Keramik' } 
                    }  
                }]
            }
        );
        expect(result).toEqual('abcdef');
    });
});