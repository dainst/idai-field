import { Map } from 'tsfun';
import { ConfigLoader, ConfigurationDefinition, ConfigurationErrors } from '../../../src/configuration/boot';
import { CustomCategoryDefinition } from '../../../src/configuration/model';
import { Category } from '../../../src/model';
import { Named } from '../../../src/tools';


/**
 * @author Daniel de Oliveira
 * @author Thomas Kleinke
 */
describe('ConfigLoader', () => {

    let libraryCategories = {} as ConfigurationDefinition;
    let configLoader: ConfigLoader;
    let configReader;
    let pouchdbManager;

    function applyConfig(customFieldsConfiguration = {},
                         languageConfiguration = {},
                         customLanguageConfiguration = {},
                         orderConfiguration = {}) {

        configReader.read.and.returnValues(
            libraryCategories,
            customLanguageConfiguration,
            languageConfiguration,
            {},
            {},
            {},
            orderConfiguration
        );
        configReader.exists.and.returnValue(true);

        pouchdbManager.getDb.and.returnValue({
            get: (_: string) => Promise.resolve({
                resource: {
                    categories: customFieldsConfiguration
                }
            })
        });
    }


    beforeEach(() => {

        libraryCategories = {} as ConfigurationDefinition;

        configReader = jasmine.createSpyObj('configReader', ['read', 'exists']);
        pouchdbManager = jasmine.createSpyObj('pouchdbManager', ['getDb']);
        applyConfig();

        configLoader = new ConfigLoader(configReader, pouchdbManager);
    });


    it('mix in common fields', async done => {

        Object.assign(libraryCategories, {
            'B:0': {
                categoryName: 'B',
                parent: 'A',
                commons: ['processor'],
                valuelists: {},
                fields: {},
                creationDate: '',
                createdBy: '',
                description: {} },
        });

        applyConfig(
            { 'A': { fields: {} }, 'B:0': { fields: {} } },
            {
                categories: {
                    B: { label: 'B_', fields: { processor: { label: 'Bearbeiter/Bearbeiterin', description: 'abc' }} },
                }, relations: {},
            },
            {},
            {});

        let pconf;
        try {
            pconf = await configLoader.go(
                { processor : { inputType: 'input', group: 'stem' }},
                { 'A': { fields: {}, userDefinedSubcategoriesAllowed: true, supercategory: true } },
                [],
                {},
                undefined,
                ['de'],
                'User'
            );
        } catch(err) {
            fail(err);
        }

        expect(pconf.getCategory('B').groups[0].fields[0]['name']).toBe('processor');
        
        done();
    });


    it('translate common fields', async done => {

        Object.assign(libraryCategories, {
            'B:0': {
                categoryName: 'B',
                parent: 'A',
                commons: ['processor'],
                valuelists: {},
                fields: {}, creationDate: '',
                createdBy: '',
                description: {}  },
        });

        applyConfig(
            { 'B:0': { fields: {} }, 'A': { fields: {} } },
            {
                commons: {
                    processor: { label: 'Bearbeiter/Bearbeiterin', description: 'abc' }
                },
                categories: {},
                relations: {}
            },
            {},
            {});

        let pconf;
        try {
            pconf = await configLoader.go(
                { processor: { inputType: 'input', group: 'stem' } },
                { 'A': { fields: {}, supercategory: true, userDefinedSubcategoriesAllowed: true } },
                [],
                {},
                undefined,
                ['de'],
                'User'
            );
        } catch(err) {
            console.log('err', err);
            fail(err);
        }

        expect(pconf.getCategory('B').groups[0].fields[0]['label']).toBe('Bearbeiter/Bearbeiterin');
        expect(pconf.getCategory('B').groups[0].fields[0]['description']).toBe('abc');

        done();
    });


    it('mix existing externally configured with internal inherits relation', async done => {

        Object.assign(libraryCategories, {
            'A1': { categoryName: 'A1', parent: 'A', fields: {}, valuelists: {}, creationDate: '', createdBy: '', description: {}, commons: [] },
            'A2': { categoryName: 'A2', parent: 'A', fields: {}, valuelists: {}, creationDate: '', createdBy: '', description: {}, commons: [] },
            'B1': { categoryName: 'B1', parent: 'B', fields: {}, valuelists: {}, creationDate: '', createdBy: '', description: {}, commons: [] },
            'B2': { categoryName: 'B2', parent: 'B', fields: {}, valuelists: {}, creationDate: '', createdBy: '', description: {}, commons: [] }
        });

        applyConfig(
            {
                'A1': { fields: {} },
                'A2': { fields: {} },
                'B1': { fields: {} },
                'B2': { fields: {} },
                'A': { fields: {} },
                'B': { fields: {} },
                'C': { fields: {} },
                'D': { fields: {} }
                },
            {},
            {},
            {});

        let pconf;

        try {
            pconf = await configLoader.go(
                {},
                {
                    'A': { fields: {}, supercategory: true, userDefinedSubcategoriesAllowed: true},
                    'B': { fields: {}, supercategory: true, userDefinedSubcategoriesAllowed: true},
                    'C': { fields: {}},
                    'D': { fields: {}}
                },
                [
                    {
                        name: 'connection',
                        label: '',
                        domain: ['C'],
                        range: ['D']
                    }, {
                        name: 'connection',
                        label: '',
                        domain: ['A:inherit'],
                        range: ['B:inherit']
                    }],
                {},
                undefined,
                ['de'],
                'User'
            );
        } catch(err) {
            fail(err);
        }

        expect((pconf.getRelationDefinitionsForDomainCategory('A') as any)[0].range).toContain('B1');
        expect((pconf.getRelationDefinitionsForDomainCategory('A1') as any)[0].range).toContain('B');
        expect((pconf.getRelationDefinitionsForDomainCategory('A2') as any)[0].range).toContain('B2');
        expect((pconf.getRelationDefinitionsForDomainCategory('C') as any)[0].range).toContain('D');

        done();
    });


    it('preprocess - convert sameOperation to sameMainCategoryResource', async done => {

        Object.assign(libraryCategories, {
            'A': { categoryName: 'A', parent: 'T', fields: {}, valuelists: {}, creationDate: '', createdBy: '', description: {}, commons: []  },
            'B': { categoryName: 'B', parent: 'T', fields: {}, valuelists: {}, creationDate: '', createdBy: '', description: {}, commons: []  }});

        applyConfig(
            { 'A': { fields: {} }, 'B': { fields: {} }, 'T': { fields: {} }});

        let pconf;
        try {
            pconf = await configLoader.go(
                {},
                {
                    A: { fields: {}},
                    B: { fields: {}},
                    T: { fields: {}, supercategory: true, userDefinedSubcategoriesAllowed: true }},
                [{ name: 'abc', label: '', domain: ['A'], range: ['B'], sameMainCategoryResource: false }], {},
                undefined, ['de'], 'User');
        } catch(err) {
            fail(err);
        }

        expect(pconf.getRelationDefinitionsForDomainCategory('A')[0].sameMainCategoryResource).toBe(false);

        done();
    });


    it('preprocess - apply language confs', async done => {

        Object.assign(libraryCategories, {
            'A': { categoryName: 'A', parent: 'Parent', fields: {}, valuelists: {}, creationDate: '', createdBy: '', description: {}, commons: [] },
            'B': { categoryName: 'B', parent: 'Parent', fields: {}, valuelists: {}, creationDate: '', createdBy: '', description: {}, commons: [] },
            'C': { categoryName: 'C', parent: 'Parent', fields: {}, valuelists: {}, creationDate: '', createdBy: '', description: {}, commons: []  }
        });

        applyConfig(
            {
                'A': { fields: {} },
                'B': { fields: {} },
                'C': { fields: {} },
                'Parent': { fields: {} }
                },
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
            },
            {});

        let pconf;
        try {
            pconf = await configLoader.go(
                {},
                {
                        Parent: { fields: {}, userDefinedSubcategoriesAllowed: true, supercategory: true },
                        A: { fields: {} },
                        B: { fields: {} }
                    },
                [{ name: 'r1', label: '', domain: ['A'], range: ['B']},
                         { name: 'r2', label: '', domain: ['A'], range: ['B']}],
                {},
                 undefined, ['de'], 'User');
        } catch(err) {
            fail(err);
        }

        expect(pconf.getCategory('A').label).toEqual('A_');
        expect(pconf.getCategory('B').label).toEqual('B__');
        expect(pconf.getCategory('C').label).toBeUndefined();

        expect(pconf.getRelationDefinitionsForDomainCategory('A')[1].label).toEqual('r1_');
        expect(pconf.getRelationDefinitionsForDomainCategory('A')[0].label).toBeFalsy();

        done();
    });


    it('preprocess - apply custom fields configuration', async done => {

        Object.assign(libraryCategories, {
            'A': {
                categoryName: 'A',
                commons: [],
                valuelists: {},
                parent: 'F',
                fields: { fieldA1: { inputType: 'unsignedInt' } },
                creationDate: '',
                createdBy: '',
                description: {}
                },
            'B': {
                categoryName: 'B',
                commons: [],
                valuelists: {},
                parent: 'G',
                fields: { fieldB1: { inputType: 'input' } },
                creationDate: '',
                createdBy: '',
                description: {}
            }
        });

        const customCategories: Map<CustomCategoryDefinition> = {
            'A': { fields: { fieldA1: { } } },
            'B': { fields: { fieldB2: { inputType: 'boolean' } } },
            'F': { fields: {} },
            'G': { fields: {} }
        };

        applyConfig(
            customCategories,
            {},
            {},
            {});

        let pconf;
        try {
            pconf = await configLoader.go({},
                {
                    'F': { fields: {}, userDefinedSubcategoriesAllowed: true, supercategory: true },
                    'G': { fields: {}, userDefinedSubcategoriesAllowed: true, supercategory: true }},[], {},
                undefined, ['de'], 'User'
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

        Object.assign(libraryCategories, {
            'Find:0': {
                categoryName: 'Find',
                commons: [],
                valuelists: {},
                fields: { fieldA1: { inputType: 'unsignedInt' } },
                creationDate: '',
                createdBy: '',
                description: {}
            }
        });

        const customCategories: Map<CustomCategoryDefinition> = {
            'B:0': {
                parent: 'Find',
                fields: { fieldC1: { inputType: 'boolean'} }
            },
            'Find:0': { fields: {} }
        };

        applyConfig(
            customCategories,
            {},
            {},
            {});

        let pconf;
        try {
            pconf = await configLoader.go({},
                { 'Find': { fields: {}, userDefinedSubcategoriesAllowed: true, supercategory: true }},[], {},
                undefined, ['de'], 'User'
            );

            expect(Named.arrayToMap<Category>(pconf.getCategoriesArray())['B:0'].groups[1].fields.find(field => field.name == 'fieldC1')
                .inputType).toEqual('boolean');

        } catch(err) {
            fail(err);
        }

        done();
    });


    it('preprocess - apply custom fields configuration - add subcategories - parent not defined', async done => {

        Object.assign(libraryCategories, {});

        const customFieldsConfiguration: Map<CustomCategoryDefinition> = {
            'B:0': {
                parent: 'Find',
                commons: [],
                valuelists: {},
                fields: { fieldC1: { inputType: 'boolean'}}
            }
        };

        applyConfig(
            customFieldsConfiguration,
            {},
            {},
            {}
        );

        try {
            await configLoader.go({}, {},[], {},
                undefined, ['de'], 'User'
            );

            fail();
        } catch(err) {
            expect(err).toEqual([ConfigurationErrors.INVALID_CONFIG_PARENT_NOT_DEFINED, 'Find']);
        }

        done();
    });


    it('preprocess - apply custom fields configuration - add subcategories - non extendable categories not allowed', async done => {

        Object.assign(libraryCategories, {});

        const customFieldsConfiguration: Map<CustomCategoryDefinition> = {
            'Extension:0': {
                parent: 'Place',
                commons: [],
                valuelists: {},
                fields: { fieldC1: { inputType: 'boolean'}}}
        };

        applyConfig(customFieldsConfiguration);

        try {
            await configLoader.go({}, { Place: { fields: { fieldA1: { inputType: 'unsignedInt' }}}},[], {},
                undefined, ['de'], 'User');
            fail();
        } catch(err) {
            expect(err).toEqual([ConfigurationErrors.TRYING_TO_SUBTYPE_A_NON_EXTENDABLE_CATEGORY, 'Place']);
        }

        done();
    });


    it('apply order configuration', async done => {

        Object.assign(libraryCategories, {
            'B': {
                categoryName: 'B',
                parent: 'Parent',
                commons: [],
                valuelists: {},
                fields: {
                    fieldB2: { inputType: 'input' },
                    fieldB3: { inputType: 'input' },
                    fieldB1: { inputType: 'input' }
                    },
                creationDate: '', createdBy: '', description: {}
                },
            'C': {
                categoryName: 'C',
                commons: [],
                valuelists: {},
                parent: 'Parent',
                fields: {
                    fieldC1: { inputType: 'input' },
                    fieldC2: { inputType: 'input' }
                    },
                creationDate: '', createdBy: '', description: {}
                },
            'A': {
                categoryName: 'A',
                commons: [],
                valuelists: {},
                parent: 'Parent',
                fields: {
                    fieldA2: { inputType: 'input' },
                    fieldA1: { inputType: 'input' }
                    },
                creationDate: '', createdBy: '', description: {}
            }
        });

        applyConfig(
            { 'A': { fields: {} }, 'B': { fields: {} }, 'C': { fields: {} }, 'Parent': { fields: {} } },
            {}, {},
             {
                categories: ['A', 'B', 'C'],
                fields: {
                    'A': ['fieldA1', 'fieldA2'],
                    'B': ['fieldB1', 'fieldB2', 'fieldB3'],
                    'C': ['fieldC1', 'fieldC2'],

                    // Ignore fields defined in Order.json but not in configuration silently
                    'D': ['fieldD1', 'fieldD2']
                }
            });

        let pconf;
        try {
            pconf = await configLoader.go({},
                { Parent: { fields: {}, userDefinedSubcategoriesAllowed: true, supercategory: true }},
                [], {},
                 undefined, ['de'], 'User'
            );

            const result = Named.arrayToMap<Category>(pconf.getCategoriesArray());

            expect(result['A'].name).toEqual('A');
            expect(result['A'].groups[0].fields[0].name).toEqual('fieldA1');
            expect(result['A'].groups[0].fields[1].name).toEqual('fieldA2');
            expect(result['B'].name).toEqual('B');
            expect(result['B'].groups[0].fields[0].name).toEqual('fieldB1');
            expect(result['B'].groups[0].fields[1].name).toEqual('fieldB2');
            expect(result['B'].groups[0].fields[2].name).toEqual('fieldB3');
            expect(result['C'].name).toEqual('C');
            expect(result['C'].groups[0].fields[0].name).toEqual('fieldC1');
            expect(result['C'].groups[0].fields[1].name).toEqual('fieldC2');
        } catch(err) {
            fail(err);
        }

        done();
    });


    it('add categories and fields only once even if they are mentioned multiple times in order configuration',
            async done => {

        Object.assign(libraryCategories, {
            A: {
                categoryName: 'A',
                parent: 'Parent',
                commons: [],
                valuelists: {},
                fields: {
                    fieldA2: { inputType: 'input' },
                    fieldA1: { inputType: 'input' }
                    },
                creationDate: '', createdBy: '', description: {}
            }
        });

        applyConfig({ A: { fields: {} }, Parent: { fields: {} } },
            {}, {}, {
                categories: ['A', 'A'],
                fields: {
                    A: ['fieldA1', 'fieldA2', 'fieldA1']
                }
            });

        let pconf;
        try {
            pconf = await configLoader.go({},
                { Parent: { fields: {}, supercategory: true, userDefinedSubcategoriesAllowed: true }}, [], {},
                undefined, ['de'], 'User'
            );

            expect(pconf.getCategoriesArray().length).toBe(2);
            expect(pconf.getCategory('A').groups[0].fields.length).toBe(2);  // fieldA1, fieldA2
            expect(pconf.getCategory('A').groups[0].fields[0].name).toEqual('fieldA1');
            expect(pconf.getCategory('A').groups[0].fields[1].name).toEqual('fieldA2');
        } catch(err) {
            fail(err);
        }

        done();
    });


    it('apply hidden', async done => {

        Object.assign(libraryCategories, {
            'A:0': {
                categoryName: 'A',
                commons: [],
                valuelists: {},
                fields: {
                    fieldA1: { inputType: 'input' },
                    fieldA2: { inputType: 'input' },
                    fieldA3: { inputType: 'input' }},
                creationDate: '', createdBy: '', description: {}  }
        });

        applyConfig({ 'A:0': { fields: {}, hidden: ['fieldA1', 'fieldA2'] } },
            {
                'A': ['fieldA1']
            },
            {
                'A': ['fieldA2']
            },
            {});

        let pconf;
        try {
            pconf = await configLoader.go({}, { A: { fields: {} }}, [], {},
                undefined, ['de'], 'User'
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
});
