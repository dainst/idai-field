import { Map } from 'tsfun';
import { BuiltInCategoryDefinition, CustomFormDefinition, LibraryCategoryDefinition,
    LibraryFormDefinition } from '../../../src/configuration';
import { ConfigLoader, ConfigurationErrors } from '../../../src/configuration/boot';
import { CategoryForm, Groups } from '../../../src/model';
import { Named, Tree } from '../../../src/tools';


/**
 * @author Daniel de Oliveira
 * @author Thomas Kleinke
 */
describe('ConfigLoader', () => {

    let configLoader: ConfigLoader;
    let configReader;
    let pouchdbManager;

    function applyConfig(libraryCategories: Map<LibraryCategoryDefinition> = {},
                         libraryForms: Map<LibraryFormDefinition> = {},
                         customForms: Map<CustomFormDefinition> = {},
                         languageConfiguration = {},
                         customLanguageConfiguration = {}) {

        configReader.read.and.returnValues(
            libraryCategories,
            libraryForms,
            {},
            languageConfiguration,
            {}, {}, {}, {}, {}, {}, {}, {}, {}
        );
        configReader.exists.and.returnValue(true);

        pouchdbManager.getDb.and.returnValue({
            get: (_: string) => Promise.resolve({
                resource: {
                    forms: customForms,
                    languages: { de: customLanguageConfiguration },
                    order: [],
                    valuelists: {}
                }
            })
        });
    }


    beforeEach(() => {

        configReader = jasmine.createSpyObj('configReader', ['read', 'exists']);
        pouchdbManager = jasmine.createSpyObj('pouchdbManager', ['getDb']);
        applyConfig();

        configLoader = new ConfigLoader(configReader, pouchdbManager);
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

        applyConfig(libraryCategories, {}, customForms, {}, {});

        let pconf;
        try {
            pconf = await configLoader.go(
                { processor : { inputType: 'input' } },
                builtInCategories,
                [],
                {},
                undefined,
                'User'
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
            customForms,
            {
                commons: {
                    processor: { label: 'Bearbeiter/Bearbeiterin', description: 'abc' }
                },
                categories: {},
                relations: {}
            },
            {}
        );

        let pconf;
        try {
            pconf = await configLoader.go(
                { processor: { inputType: 'input' } },
                builtInCategories,
                [],
                {},
                undefined,
                'User'
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

        applyConfig(
            libraryCategories,
            {},
            customForms,
            {},
            {}
        );

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
                        domain: ['A:inherit'],
                        range: ['B:inherit'],
                        editable: false,
                        inputType: 'relation'
                    }],
                {},
                undefined,
                'User'
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


    // TODO Adjust title / check if this test is still necessary
    it('preprocess - convert sameOperation to sameMainCategoryResource', async done => {

        const builtInCategories: Map<BuiltInCategoryDefinition> = {
            T: {
                fields: {},
                minimalForm: {
                    groups: []
                },
                supercategory: true,
                userDefinedSubcategoriesAllowed: true
            },
            A: { 
                parent: 'T',
                fields: {},
                minimalForm: {
                    groups: []
                }
             },
            B: {
                parent: 'T',
                fields: {},
                minimalForm: {
                    groups: []
                }
            }
        };

        const customForms: Map<CustomFormDefinition> = {
            A: { fields: {} },
            B: { fields: {} },
            T: { fields: {} }
        };

        applyConfig(
            {},
            {},
            customForms
        );

        let pconf;
        try {
            pconf = await configLoader.go(
                {},
                builtInCategories,
                [{
                    name: 'abc',
                    domain: ['A'],
                    range: ['B'],
                    sameMainCategoryResource: false,
                    editable: false,
                    inputType: 'relation'
                }],
                {}, undefined, 'User');
        } catch(err) {
            fail(err);
        }

        expect(pconf.getRelationsForDomainCategory('A')[0].sameMainCategoryResource).toBe(false);

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
            customForms,
            {
                categories: {
                    A: { label: 'A_' },
                    B: { label: 'B_' }
                },
                relations: {
                    r1: { label: 'r1_' }
                }
            }, {
                categories: {
                    B: { label: 'B__' }
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
                undefined, 'User'
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
                fields: {},
                minimalForm: {
                    groups: []
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
                fields: { fieldA1: { inputType: 'unsignedInt' } },
                description: {}
            },
            B: {
                parent: 'G',
                fields: { fieldB1: { inputType: 'input' } },
                description: {}
            }
        };
        
        const customForms: Map<CustomFormDefinition> = {
            A: {
                fields: {
                    fieldA1: { inputType: 'boolean' } // Ignore this field
                },
                groups: [{ name: Groups.STEM, fields: ['fieldA1'] }]
            },
            B: {
                fields: { fieldB2: { inputType: 'boolean' } },
                groups: [{ name: Groups.STEM, fields: ['fieldB1', 'fieldB2'] }]
            },
            F: {
                fields: {},
                groups: []
            },
            G: {
                fields: {},
                groups: []
            }
        };

        applyConfig(
            libraryCategories,
            {},
            customForms,
            {},
            {}
        );

        let pconf;
        try {
            pconf = await configLoader.go(
                {},
                builtInCategories,
                [],
                {},
                undefined, 'User'
            );

            expect(pconf.getCategory('A').groups[0].fields.find(field => field.name == 'fieldA1')
                .inputType).toEqual('unsignedInt');
            expect(pconf.getCategory('B').groups[0].fields.find(field => field.name == 'fieldB1')
                .inputType).toEqual('input');
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
                minimalForm: {
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
            customForms,
            {},
            {}
        );

        let pconf;
        try {
            pconf = await configLoader.go(
                {},
                builtInCategories,
                [], {}, undefined, 'User'
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

        applyConfig(
            {},
            {},
            customForms,
            {},
            {}
        );

        try {
            await configLoader.go({}, {},[], {}, undefined, 'User');
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

        applyConfig(
            {},
            {},
            customForms,
            {},
            {}
        );

        try {
            await configLoader.go({},
                builtInCategories,
                [], {}, undefined, 'User');
            fail();
        } catch(err) {
            expect(err).toEqual([ConfigurationErrors.TRYING_TO_SUBTYPE_A_NON_EXTENDABLE_CATEGORY, 'Place']);
        }

        done();
    });


    it('apply groups configuration', async done => {

        const builtInCategories: Map<BuiltInCategoryDefinition> = {
            Parent: {
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
                parent: 'Parent',
                fields: {
                    fieldB2: { inputType: 'input' },
                    fieldB3: { inputType: 'input' },
                    fieldB1: { inputType: 'input' }
                },
                minimalForm: {
                    groups: [
                        { name: Groups.STEM, fields: ['fieldB1', 'fieldB2'] },
                        { name: Groups.PARENT, fields: ['fieldB3'] }
                    ],
                } as any,
                description: {}
            },
            C: {
                parent: 'Parent',
                fields: {
                    fieldC1: { inputType: 'input' },
                    fieldC2: { inputType: 'input' }
                },
                description: {}
            },
            A: {
                parent: 'Parent',
                fields: {
                    fieldA2: { inputType: 'input' },
                    fieldA1: { inputType: 'input' }
                },
                description: {}
            }
        };

        const libraryForms: Map<LibraryFormDefinition> = {
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
                    { name: Groups.PARENT, fields: ['fieldC2'] }
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
            Parent: { fields: {} }
        };

        applyConfig(
            libraryCategories,
            libraryForms,
            customForms,
            {},
            {}
        );

        let pconf;
        try {
            pconf = await configLoader.go({},
                builtInCategories,
                [], {},
                undefined, 'User'
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
            expect(result['B'].groups[1].name).toBe(Groups.PARENT);
            expect(result['B'].groups[1].fields.length).toBe(1);
            expect(result['B'].groups[1].fields[0].name).toEqual('fieldB3');
            expect(result['C'].name).toEqual('C');
            expect(result['C'].groups[0].name).toBe(Groups.STEM);
            expect(result['C'].groups[0].fields.length).toBe(1);
            expect(result['C'].groups[0].fields[0].name).toEqual('fieldC1');
            expect(result['C'].groups[1].name).toBe(Groups.PARENT);
            expect(result['C'].groups[1].fields.length).toBe(1);
            expect(result['C'].groups[1].fields[0].name).toEqual('fieldC2');
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

        applyConfig(
            libraryCategories,
            {},
            customForms,
            {},
            {}
        );

        let pconf;
        try {
            pconf = await configLoader.go({},
                builtInCategories,
                [], {}, undefined, 'User'
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
                        fields: ['fieldA1', 'fieldA2', 'fieldA3']
                    }]
                } as any,
                description: {}
            }
        };
        
        const customForms: Map<CustomFormDefinition> = {
            A: {
                fields: {},
                hidden: ['fieldA1', 'fieldA2']
            }
        };

        applyConfig(
            libraryCategories,
            {},
            customForms,
            {},
            {}
        );

        let pconf;
        try {
            pconf = await configLoader.go({}, builtInCategories, [], {},
                undefined, 'User'
            );
            const result = pconf.getCategory('A').groups[0];

            expect(result.fields[0].name).toEqual('fieldA1');
            expect(result.fields[0].visible).toBe(false);
            expect(result.fields[0].editable).toBe(false);
            expect(result.fields[1].name).toEqual('fieldA2');
            expect(result.fields[1].visible).toBe(false);
            expect(result.fields[1].editable).toBe(false);
            expect(result.fields[2].name).toEqual('fieldA3');
            expect(result.fields[2].visible).toBe(true);
            expect(result.fields[2].editable).toBe(true);
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
            libraryForms,
            customForms,
            {},
            {}
        );

        let pconf;
        try {
            pconf = await configLoader.go(
                {},
                builtInCategories,
                [],
                {},
                undefined,
                'User'
            );
        } catch(err) {
            fail(err);
        }

        expect(pconf.getCategory('A').libraryId).toBe('A');
        expect(pconf.getCategory('B').libraryId).toBe('B:default');
        expect(pconf.getCategory('C').libraryId).toBe('C');
        
        done();
    });
});
