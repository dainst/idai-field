import { Map } from 'tsfun';
import { BuiltInCategoryDefinition, CustomFormDefinition, LibraryCategoryDefinition,
    LibraryFormDefinition } from '../../../src/configuration';
import { ConfigLoader, ConfigurationErrors } from '../../../src/configuration/boot';
import { CategoryForm } from '../../../src/model/configuration/category-form';
import { Groups } from '../../../src/model/configuration/group';
import { Named, Tree } from '../../../src/tools';


/**
 * @author Daniel de Oliveira
 * @author Thomas Kleinke
 */
describe('ConfigLoader', () => {

    let configLoader: ConfigLoader;
    let configReader;

    function applyConfig(libraryCategories: Map<LibraryCategoryDefinition> = {},
                         libraryForms: Map<LibraryFormDefinition> = {},
                         languageConfiguration = {}) {

        configReader.read.and.returnValues(
            libraryCategories,
            libraryForms,
            {},
            languageConfiguration,
            {}, {}, {}, {}, {}, {}, {}, {}, {}, {}, {}, {}, {}, {}, {}
        );
        configReader.exists.and.returnValue(true);
        configReader.getValuelistsLanguages.and.returnValue({});
    }


    function getConfigurationDocument(customForms: Map<CustomFormDefinition> = {},
                                      customLanguageConfiguration = {}): any {

        return {
            resource: {
                forms: customForms,
                languages: { de: customLanguageConfiguration },
                order: [],
                valuelists: {}
            }
        };
    }


    beforeEach(() => {

        configReader = jasmine.createSpyObj('configReader', ['read', 'exists', 'getValuelistsLanguages']);
        applyConfig();

        configLoader = new ConfigLoader(configReader);
    });


    it('mix in common fields', async done => {

        const builtInCategories: Map<BuiltInCategoryDefinition> = {
            A: {
                fields: {},
                minimalForm: {
                    groups: []
                },
                userDefinedSubcategoriesAllowed: true,
                supercategory: true
            } 
        };

        const libraryCategories: Map<LibraryCategoryDefinition> = {
            B: {
                parent: 'A',
                fields: {},
                description: {},
                minimalForm: {
                    groups: [{ name: Groups.STEM, fields: ['processor'] }]
                } as any
            },
        };

        const customForms: Map<CustomFormDefinition> = {
            A: {
                fields: {}
            },
            B: {
                fields: {}
            }
        };

        applyConfig(libraryCategories);

        let pconf;
        try {
            pconf = await configLoader.go(
                { processor : { inputType: 'input' } },
                builtInCategories,
                [],
                {},
                getConfigurationDocument(customForms)
            );
        } catch(err) {
            fail(err);
        }

        expect(pconf.getCategory('B').groups[0].fields[0]['name']).toBe('processor');
        
        done();
    });


    it('translate common fields', async done => {

        const builtInCategories: Map<BuiltInCategoryDefinition> = {
            A: {
                fields: {},
                minimalForm: {
                    groups: []
                },
                userDefinedSubcategoriesAllowed: true,
                supercategory: true
            } 
        };

        const libraryCategories: Map<LibraryCategoryDefinition> = {
            B: {
                parent: 'A',
                fields: {},
                description: {},
                minimalForm: {
                    groups: [{ name: Groups.STEM, fields: ['processor'] }]
                } as any
            },
        };

        const customForms: Map<CustomFormDefinition> = {
            A: {
                fields: {}
            },
            B: {
                fields: {}
            }
        };

        applyConfig(
            libraryCategories,
            {},
            {
                commons: {
                    processor: { label: 'Bearbeiter/Bearbeiterin', description: 'abc' }
                },
                categories: {},
                relations: {}
            }
        );

        let pconf;
        try {
            pconf = await configLoader.go(
                { processor: { inputType: 'input' } },
                builtInCategories,
                [],
                {},
                getConfigurationDocument(customForms)
            );
        } catch(err) {
            console.log('err', err);
            fail(err);
        }

        expect(pconf.getCategory('B').groups[0].fields[0].label.de).toBe('Bearbeiter/Bearbeiterin');
        expect(pconf.getCategory('B').groups[0].fields[0].description.de).toBe('abc');

        done();
    });


    it('mix existing externally configured with internal inherits relation', async done => {

        const builtInCategories: Map<BuiltInCategoryDefinition> = {
            A: {
                fields: {},
                minimalForm: {
                    groups: []
                },
                supercategory: true,
                userDefinedSubcategoriesAllowed: true
            },
            B: {
                fields: {},
                minimalForm: {
                    groups: []
                },
                supercategory: true,
                userDefinedSubcategoriesAllowed: true
            },
            C: {
                fields: {},
                minimalForm: {
                    groups: []
                },
            },
            D: {
                fields: {},
                minimalForm: {
                    groups: []
                }
            }
        }

        const libraryCategories: Map<LibraryCategoryDefinition> = {
            'A1': { parent: 'A', fields: {}, description: {} },
            'A2': { parent: 'A', fields: {}, description: {} },
            'B1': { parent: 'B', fields: {}, description: {} },
            'B2': { parent: 'B', fields: {}, description: {} }
        };

        const customForms: Map<CustomFormDefinition> = {
            'A1': { fields: {} },
            'A2': { fields: {} },
            'B1': { fields: {} },
            'B2': { fields: {} },
            'A': { fields: {} },
            'B': { fields: {} },
            'C': { fields: {} },
            'D': { fields: {} }
        };

        applyConfig(libraryCategories);

        let pconf;

        try {
            pconf = await configLoader.go(
                {},
                builtInCategories,
                [
                    {
                        name: 'connection',
                        domain: ['C'],
                        range: ['D'],
                        editable: false,
                        inputType: 'relation'
                    }, {
                        name: 'connection',
                        domain: ['A'],
                        range: ['B'],
                        editable: false,
                        inputType: 'relation'
                    }],
                {},
                getConfigurationDocument(customForms)
            );
        } catch(err) {
            fail(err);
        }

        expect((pconf.getRelationsForDomainCategory('A') as any)[0].range).toContain('B1');
        expect((pconf.getRelationsForDomainCategory('A1') as any)[0].range).toContain('B');
        expect((pconf.getRelationsForDomainCategory('A2') as any)[0].range).toContain('B2');
        expect((pconf.getRelationsForDomainCategory('C') as any)[0].range).toContain('D');

        done();
    });


    it('preprocess - apply language confs', async done => {

        const builtInCategories: Map<BuiltInCategoryDefinition> = {
            Parent: { 
                fields: {},
                minimalForm: { groups: [] },
                userDefinedSubcategoriesAllowed: true,
                supercategory: true
            },
            A: { parent: 'Parent', fields: {}, minimalForm: { groups: [] } },
            B: { parent: 'Parent', fields: {}, minimalForm: { groups: [] } },
            C: { parent: 'Parent', fields: {}, minimalForm: { groups: [] } }
        };

        const customForms: Map<CustomFormDefinition> = {
            A: { fields: {} },
            B: { fields: {} },
            C: { fields: {} },
            Parent: { fields: {} }
        };

        applyConfig(
            {},
            {},
            {
                categories: {
                    A: { label: 'A_' },
                    B: { label: 'B_' }
                },
                relations: {
                    r1: { label: 'r1_' }
                }
            }
        );

        let pconf;
        try {
            pconf = await configLoader.go(
                {},
                builtInCategories,
                [
                    { name: 'r1', domain: ['A'], range: ['B'], editable: false, inputType: 'relation' },
                    { name: 'r2', domain: ['A'], range: ['B'], editable: false, inputType: 'relation' }
                ],
                {},
                getConfigurationDocument(
                    customForms,
                    {
                        categories: {
                            B: { label: 'B__' }
                        }
                    }
                )
            );
        } catch(err) {
            fail(err);
        }

        expect(pconf.getCategory('A').label.de).toEqual('A_');
        expect(pconf.getCategory('B').label.de).toEqual('B__');
        expect(pconf.getCategory('C').label).toEqual({});

        expect(pconf.getRelationsForDomainCategory('A')[1].label.de).toEqual('r1_');
        expect(pconf.getRelationsForDomainCategory('A')[0].label).toEqual({});

        done();
    });


    it('preprocess - apply custom fields configuration', async done => {

        const builtInCategories: Map<BuiltInCategoryDefinition> = {
            F: {
                fields: {
                    fieldF1: { inputType: 'input' }
                },
                minimalForm: {
                    groups: [{ name: Groups.STEM, fields: ['fieldF1'] }]
                },
                userDefinedSubcategoriesAllowed: true,
                supercategory: true
            },
            G: {
                fields: {},
                minimalForm: {
                    groups: []
                },
                userDefinedSubcategoriesAllowed: true,
                supercategory: true
            }
        }

        const libraryCategories: Map<LibraryCategoryDefinition> = {
            A: {
                parent: 'F',
                fields: { fieldA1: { inputType: 'input' } },
                description: {}
            },
            B: {
                parent: 'G',
                fields: { fieldB1: { inputType: 'unsignedInt' } },
                description: {}
            }
        };
        
        const customForms: Map<CustomFormDefinition> = {
            A: {
                fields: {
                    fieldA1: { inputType: 'text' }
                },
                groups: [{ name: Groups.STEM, fields: ['fieldF1', 'fieldA1'] }]
            },
            B: {
                fields: { fieldB2: { inputType: 'boolean' } },
                groups: [{ name: Groups.STEM, fields: ['fieldB1', 'fieldB2'] }]
            },
            F: {
                fields: {
                    fieldF1: { inputType: 'url' }
                },
                groups: [{ name: Groups.STEM, fields: ['fieldF1'] }]
            },
            G: {
                fields: {},
                groups: []
            }
        };

        applyConfig(libraryCategories);

        let pconf;
        try {
            pconf = await configLoader.go(
                {},
                builtInCategories,
                [],
                {},
                getConfigurationDocument(customForms)
            );

            expect(pconf.getCategory('F').groups[0].fields.find(field => field.name == 'fieldF1')
                .inputType).toEqual('url');
            expect(pconf.getCategory('A').groups[0].fields.find(field => field.name == 'fieldF1')
                .inputType).toEqual('url');
            expect(pconf.getCategory('A').groups[0].fields.find(field => field.name == 'fieldA1')
                .inputType).toEqual('text');
            expect(pconf.getCategory('B').groups[0].fields.find(field => field.name == 'fieldB1')
                .inputType).toEqual('unsignedInt');
            expect(pconf.getCategory('B').groups[0].fields.find(field => field.name == 'fieldB2')
                .inputType).toEqual('boolean');

        } catch(err) {
            fail(err);
        }

        done();
    });


    it('preprocess - apply custom fields configuration - add subcategories', async done => {

        const builtInCategories: Map<BuiltInCategoryDefinition> = {
            Find: {
                fields: {},
                minimalForm: {
                    groups: []
                },
                userDefinedSubcategoriesAllowed: true,
                supercategory: true
            }
        }

        const libraryCategories: Map<LibraryCategoryDefinition> = {
            Find: {
                fields: { fieldA1: { inputType: 'unsignedInt' } },
                minimalForm: {
                    groups: [
                        { name: Groups.STEM, fields: ['fieldA1'] }
                    ]
                } as any,
                description: {}
            }
        };
        
        const customForms: Map<CustomFormDefinition> = {
            B: {
                parent: 'Find',
                fields: { fieldB1: { inputType: 'boolean'} },
                groups: [
                    { name: Groups.STEM, fields: ['fieldA1', 'fieldB1'] }
                ]
            },
            Find: {
                fields: {}
            }
        };

        applyConfig(
            libraryCategories,
            {},
            {}
        );

        let pconf;
        try {
            pconf = await configLoader.go(
                {},
                builtInCategories,
                [], {},
                getConfigurationDocument(customForms)
            );

            expect(Named.arrayToMap<CategoryForm>(Tree.flatten(pconf.getCategories()))['B']
                .groups[0].fields
                .find(field => field.name == 'fieldB1').inputType)
                .toEqual('boolean');

        } catch(err) {
            fail(err);
        }

        done();
    });


    it('preprocess - apply custom fields configuration - add subcategories - parent not defined', async done => {

        const customForms: Map<CustomFormDefinition> = {
            'B': {
                parent: 'Find',
                valuelists: {},
                fields: { fieldC1: { inputType: 'boolean'} },
                groups: [{ name: Groups.STEM, fields: ['fieldC1'] }]
            }
        };

        applyConfig();

        try {
            await configLoader.go(
                {}, {},[], {},
                getConfigurationDocument(customForms)
            );
            fail();
        } catch(err) {
            expect(err).toEqual([ConfigurationErrors.INVALID_CONFIG_PARENT_NOT_DEFINED, 'Find']);
        }

        done();
    });


    it('preprocess - apply custom fields configuration - add subcategories - non extendable categories not allowed', async done => {

        const builtInCategories: Map<BuiltInCategoryDefinition> = {
            Place: {
                fields: { fieldA1: { inputType: 'unsignedInt' } },
                minimalForm: {
                    groups: []
                }
            }
        };

        const customForms: Map<CustomFormDefinition> = {
            Extension: {
                parent: 'Place',
                valuelists: {},
                fields: { fieldC1: { inputType: 'boolean'} },
                groups: [{ name: Groups.STEM, fields: ['fieldC1'] }]
            }
        };

        applyConfig();

        try {
            await configLoader.go({},
                builtInCategories,
                [], {},
                getConfigurationDocument(customForms)
            );
            fail();
        } catch(err) {
            expect(err).toEqual([ConfigurationErrors.TRYING_TO_SUBTYPE_A_NON_EXTENDABLE_CATEGORY, 'Place']);
        }

        done();
    });


    it('apply groups configuration', async done => {

        const builtInCategories: Map<BuiltInCategoryDefinition> = {
            Parent1: {
                fields: {
                    parent1Field: { inputType: 'input' }
                },
                minimalForm: {
                    groups: []
                },
                userDefinedSubcategoriesAllowed: true,
                supercategory: true
            },
            Parent2: {
                fields: {},
                minimalForm: {
                    groups: []
                },
                userDefinedSubcategoriesAllowed: true,
                supercategory: true
            }
        };

        const libraryCategories: Map<LibraryCategoryDefinition> = {
            Parent1: {
                fields: {
                    parent1Field: { inputType: 'input' }
                },
                description: {}
            },
            Parent2: {
                fields: {
                    parent2Field: { inputType: 'input' }
                },
                description: {}
            },
            B: {
                parent: 'Parent1',
                fields: {
                    fieldB2: { inputType: 'input' },
                    fieldB3: { inputType: 'input' },
                    fieldB1: { inputType: 'input' }
                },
                minimalForm: {
                    groups: [
                        { name: Groups.STEM, fields: ['fieldB1', 'fieldB2'] },
                        { name: Groups.PROPERTIES, fields: ['fieldB3'] }
                    ],
                } as any,
                description: {}
            },
            C: {
                parent: 'Parent1',
                fields: {
                    fieldC1: { inputType: 'input' },
                    fieldC2: { inputType: 'input' }
                },
                description: {}
            },
            A: {
                parent: 'Parent1',
                fields: {
                    fieldA2: { inputType: 'input' },
                    fieldA1: { inputType: 'input' }
                },
                description: {}
            },
            D: {
                parent: 'Parent2',
                fields: {},
                description: {}
            }
        };

        const libraryForms: Map<LibraryFormDefinition> = {
            'Parent1:default': {
                categoryName: 'Parent1',
                groups: [
                    { name: Groups.STEM, fields: ['parent1Field'] }
                ],
                valuelists: {},
                description: {},
                createdBy: '',
                creationDate: ''
            },
            'Parent2:default': {
                categoryName: 'Parent2',
                groups: [
                    { name: Groups.STEM, fields: ['parent2Field'] }
                ],
                valuelists: {},
                description: {},
                createdBy: '',
                creationDate: ''
            },
            'A:default': {
                categoryName: 'A',
                groups: [
                    { name: Groups.STEM, fields: ['fieldA1', 'fieldA2'] }
                ],
                valuelists: {},
                description: {},
                createdBy: '',
                creationDate: ''
            },
            'C:default': {
                categoryName: 'C',
                groups: [
                    { name: Groups.STEM, fields: ['fieldC1'] },
                    { name: Groups.PROPERTIES, fields: ['fieldC2'] }
                ],
                valuelists: {},
                description: {},
                createdBy: '',
                creationDate: ''
            }
        };
        
        const customForms: Map<CustomFormDefinition> = {
            'A:default': { fields: {} },
            B: { fields: {} },
            'C:default': { fields: {} },
            D: { fields: {} },
            Parent1: { fields: {} },
            'Parent2:default': { fields: {} }
        };

        applyConfig(
            libraryCategories,
            libraryForms
        );

        let pconf;
        try {
            pconf = await configLoader.go({},
                builtInCategories,
                [], {},
                getConfigurationDocument(customForms)
            );

            const result = Named.arrayToMap<CategoryForm>(Tree.flatten(pconf.getCategories()));

            expect(result['A'].name).toEqual('A');
            expect(result['A'].groups[0].name).toBe(Groups.STEM);
            expect(result['A'].groups[0].fields.length).toBe(2);
            expect(result['A'].groups[0].fields[0].name).toEqual('fieldA1');
            expect(result['A'].groups[0].fields[1].name).toEqual('fieldA2');
            expect(result['B'].name).toEqual('B');
            expect(result['B'].groups[0].name).toBe(Groups.STEM);
            expect(result['B'].groups[0].fields.length).toBe(2);
            expect(result['B'].groups[0].fields[0].name).toEqual('fieldB1');
            expect(result['B'].groups[0].fields[1].name).toEqual('fieldB2');
            expect(result['B'].groups[1].name).toBe(Groups.PROPERTIES);
            expect(result['B'].groups[1].fields.length).toBe(1);
            expect(result['B'].groups[1].fields[0].name).toEqual('fieldB3');
            expect(result['C'].name).toEqual('C');
            expect(result['C'].groups[0].name).toBe(Groups.STEM);
            expect(result['C'].groups[0].fields.length).toBe(1);
            expect(result['C'].groups[0].fields[0].name).toEqual('fieldC1');
            expect(result['C'].groups[1].name).toBe(Groups.PROPERTIES);
            expect(result['C'].groups[1].fields.length).toBe(1);
            expect(result['C'].groups[1].fields[0].name).toEqual('fieldC2');
            expect(result['D'].name).toEqual('D');
            expect(result['D'].groups[0].name).toBe(Groups.STEM);
            expect(result['D'].groups[0].fields.length).toBe(1);
            expect(result['D'].groups[0].fields[0].name).toEqual('parent2Field');
        } catch(err) {
            fail(err);
        }

        done();
    });


    it('add fields only once even if they are mentioned multiple times in groups configuration', async done => {

        const builtInCategories: Map<BuiltInCategoryDefinition> = {
            Parent: {
                fields: {},
                minimalForm: {
                    groups: []
                },
                supercategory: true,
                userDefinedSubcategoriesAllowed: true
            }
        };

        const libraryCategories: Map<LibraryCategoryDefinition> = {
            A: {
                parent: 'Parent',
                fields: {
                    fieldA2: { inputType: 'input' },
                    fieldA1: { inputType: 'input' }
                },
                minimalForm: {
                    groups: [
                        { name: Groups.STEM, fields: ['fieldA1', 'fieldA2', 'fieldA1'] }
                    ]
                } as any,
                description: {}
            }
        };
        
        const customForms: Map<CustomFormDefinition> = {
            A: { fields: {} },
            Parent: { fields: {} }
        };

        applyConfig(libraryCategories);

        let pconf;
        try {
            pconf = await configLoader.go({},
                builtInCategories,
                [], {},
                getConfigurationDocument(customForms)
            );

            expect(Tree.flatten(pconf.getCategories()).length).toBe(2);
            expect(pconf.getCategory('A').groups[0].fields.length).toBe(2);
            expect(pconf.getCategory('A').groups[0].fields[0].name).toEqual('fieldA1');
            expect(pconf.getCategory('A').groups[0].fields[1].name).toEqual('fieldA2');
        } catch(err) {
            fail(err);
        }

        done();
    });


   it('apply hidden', async done => {

        const builtInCategories: Map<BuiltInCategoryDefinition> = {
            A: {
                fields: {},
                minimalForm: {
                    groups: []
                }
            },
            B: {
                fields: {},
                minimalForm: {
                    groups: []
                }
            },
            C: {
                parent: 'A',
                fields: {},
                minimalForm: {
                    groups: []
                }
            }
        };

        const libraryCategories: Map<LibraryCategoryDefinition> = {
            A: {
                fields: {
                    fieldA1: { inputType: 'input' },
                    fieldA2: { inputType: 'input' },
                    fieldA3: { inputType: 'input' }
                },
                minimalForm: {
                    groups: [{
                        name: Groups.STEM,
                        fields: ['fieldA1', 'fieldA2', 'fieldA3', 'relation1']
                    }]
                } as any,
                description: {}
            }
        };
        
        const customForms: Map<CustomFormDefinition> = {
            A: {
                fields: {},
                hidden: ['fieldA1', 'fieldA2', 'relation1']
            },
            B: {
                fields: {}
            },
            C: {
                fields: {},
                hidden: ['fieldA3']
            }
        };

        applyConfig(libraryCategories);

        let pconf;
        try {
            pconf = await configLoader.go(
                {}, builtInCategories,
                [{ name: 'relation1', domain: ['A'], range: ['B'], inputType: 'relation' }],
                {},
                getConfigurationDocument(customForms)
            );
            
            const resultA = pconf.getCategory('A').groups[0];
            expect(resultA.fields[0].name).toEqual('fieldA1');
            expect(resultA.fields[0].visible).toBe(false);
            expect(resultA.fields[0].editable).toBe(false);
            expect(resultA.fields[1].name).toEqual('fieldA2');
            expect(resultA.fields[1].visible).toBe(false);
            expect(resultA.fields[1].editable).toBe(false);
            expect(resultA.fields[2].name).toEqual('fieldA3');
            expect(resultA.fields[2].visible).toBe(true);
            expect(resultA.fields[2].editable).toBe(true);
            expect(resultA.fields[3].name).toEqual('relation1');
            expect(resultA.fields[3].visible).toBe(false);
            expect(resultA.fields[3].editable).toBe(false);

            const resultC = pconf.getCategory('C').groups[0];
            expect(resultC.fields[0].name).toEqual('fieldA1');
            expect(resultC.fields[0].visible).toBe(false);
            expect(resultC.fields[0].editable).toBe(false);
            expect(resultC.fields[1].name).toEqual('fieldA2');
            expect(resultC.fields[1].visible).toBe(false);
            expect(resultC.fields[1].editable).toBe(false);
            expect(resultC.fields[2].name).toEqual('fieldA3');
            expect(resultC.fields[2].visible).toBe(false);
            expect(resultC.fields[2].editable).toBe(false);
            expect(resultC.fields[3].name).toEqual('relation1');
            expect(resultC.fields[3].visible).toBe(false);
            expect(resultC.fields[3].editable).toBe(false);
        } catch(err) {
            fail(err);
        }

        done();
    });


    it('set libraryId', async done => {

        const builtInCategories: Map<BuiltInCategoryDefinition> = {
            A: {
                fields: {},
                minimalForm: {
                    groups: []
                 },
                 userDefinedSubcategoriesAllowed: true,
                 supercategory: true
            },
            B: {
                fields: {},
                minimalForm: {
                    groups: []
                }
            }
        };

        const libraryForms: Map<LibraryFormDefinition> = {
            'B:default': {
                categoryName: 'B',
                groups: [],
                valuelists: {},
                description: {},
                createdBy: '',
                creationDate: ''
            }
        };
        
        const customForms: Map<CustomFormDefinition> = {
            A: { fields: {} },
            'B:default': { fields: {} },
            C: { parent: 'A', fields: {} }
        };

        applyConfig(
            {},
            libraryForms
        );

        let pconf;
        try {
            pconf = await configLoader.go(
                {},
                builtInCategories,
                [],
                {},
                getConfigurationDocument(customForms)
            );
        } catch(err) {
            fail(err);
        }

        expect(pconf.getCategory('A').libraryId).toBe('A');
        expect(pconf.getCategory('B').libraryId).toBe('B:default');
        expect(pconf.getCategory('C').libraryId).toBe('C');
        
        done();
    });


    it('include all built-in relations', async done => {

        const builtInCategories: Map<BuiltInCategoryDefinition> = {
            A: {
                fields: {},
                minimalForm: {
                    groups: [
                        { name: 'stem', fields: ['isSimilarTo'] }
                    ]
                },
                supercategory: true
            },
            B: {
                fields: {},
                minimalForm: {
                    groups: [
                        { name: 'stem', fields: ['isSameAs'] }
                    ]
                },
                supercategory: true
            }
        };

        const customForms: Map<CustomFormDefinition> = {
            'A': { fields: {} },
            'B': { fields: {} }
        };

        applyConfig();

        let pconf;

        try {
            pconf = await configLoader.go(
                {},
                builtInCategories,
                [
                    {
                        name: 'isRecordedIn',
                        domain: ['A'],
                        range: ['B'],
                        editable: false,
                        visible: false,
                        inputType: 'relation'
                    },
                    {
                        name: 'isSimilarTo',
                        domain: ['A'],
                        range: ['A'],
                        inputType: 'relation'
                    },
                    {
                        name: 'isSameAs',
                        domain: ['B'],
                        range: ['B'],
                        inputType: 'relation'
                    }
                ],
                {},
                getConfigurationDocument(customForms),
                true
            );
        } catch(err) {
            fail(err);
        }

        expect(pconf.getCategory('A').groups[0].fields.length).toBe(2);
        expect(pconf.getCategory('A').groups[0].fields[0].name).toEqual('isSimilarTo');
        expect(pconf.getCategory('A').groups[0].fields[1].name).toEqual('isRecordedIn');
        expect(pconf.getCategory('B').groups[0].fields.length).toBe(1);
        expect(pconf.getCategory('B').groups[0].fields[0].name).toEqual('isSameAs');

        done();
    });


    it('include custom relations', async done => {

        const builtInCategories: Map<BuiltInCategoryDefinition> = {
            A: {
                fields: {},
                minimalForm: {
                    groups: [
                        { name: 'stem', fields: ['isSimilarTo'] }
                    ]
                },
                supercategory: true
            },
            B: {
                fields: {},
                minimalForm: {
                    groups: [
                        { name: 'stem', fields: [] }
                    ]
                },
                supercategory: true
            }
        };

        const customForms: Map<CustomFormDefinition> = {
            'A': {
                fields: {
                    customRelation: {
                        inputType: 'relation',
                        range: ['B']
                    }
                },
                groups: [
                    { name: 'stem', fields: ['isSimilarTo', 'customRelation'] }
                ]
            },
            'B': { fields: {} }
        };

        applyConfig();

        let pconf;

        try {
            pconf = await configLoader.go(
                {},
                builtInCategories,
                [
                    {
                        name: 'isSimilarTo',
                        domain: ['A'],
                        range: ['A'],
                        inputType: 'relation'
                    }
                ],
                {},
                getConfigurationDocument(customForms),
                true
            );
        } catch(err) {
            fail(err);
        }

        expect(pconf.getCategory('A').groups[0].fields.length).toBe(2);
        expect(pconf.getCategory('A').groups[0].fields[0].name).toEqual('isSimilarTo');
        expect(pconf.getCategory('A').groups[0].fields[1].name).toEqual('customRelation');
        expect(pconf.getRelations()[0].name).toEqual('customRelation');
        expect(pconf.getRelations()[0].domain.length).toBe(1);
        expect(pconf.getRelations()[0].domain[0]).toBe('A');
        expect(pconf.getRelations()[0].range.length).toBe(1);
        expect(pconf.getRelations()[0].range[0]).toBe('B');
        expect(pconf.getRelations()[1].name).toEqual('isSimilarTo');

        done();
    });
});
