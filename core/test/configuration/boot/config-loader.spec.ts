import { Map } from 'tsfun';
import { ConfigLoader, ConfigurationDefinition, ConfigurationErrors } from '../../../src/configuration/boot';
import { CustomCategoryDefinition } from '../../../src/configuration/model';
import { Category, Groups } from '../../../src/model';
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
                         customLanguageConfiguration = {}) {

        configReader.read.and.returnValues(
            libraryCategories,
            languageConfiguration,
            {}, {}, {}, {}, {}, {}, {}, {}, {}
        );
        configReader.exists.and.returnValue(true);

        pouchdbManager.getDb.and.returnValue({
            get: (_: string) => Promise.resolve({
                resource: {
                    categories: customFieldsConfiguration,
                    languages: { de: customLanguageConfiguration }
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
            {}
        );

        let pconf;
        try {
            pconf = await configLoader.go(
                { processor : { inputType: 'input' } },
                { 'A': { fields: {}, groups: [], userDefinedSubcategoriesAllowed: true, supercategory: true } },
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
            {}
        );

        let pconf;
        try {
            pconf = await configLoader.go(
                { processor: { inputType: 'input' } },
                { 'A': { fields: {}, groups: [], supercategory: true, userDefinedSubcategoriesAllowed: true } },
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
            {}
        );

        let pconf;

        try {
            pconf = await configLoader.go(
                {},
                {
                    'A': { fields: {}, groups: [], supercategory: true, userDefinedSubcategoriesAllowed: true},
                    'B': { fields: {}, groups: [], supercategory: true, userDefinedSubcategoriesAllowed: true},
                    'C': { fields: {}, groups: [] },
                    'D': { fields: {}, groups: [] }
                },
                [
                    {
                        name: 'connection',
                        domain: ['C'],
                        range: ['D']
                    }, {
                        name: 'connection',
                        domain: ['A:inherit'],
                        range: ['B:inherit']
                    }],
                {},
                undefined,
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
                    A: { fields: {}, groups: [] },
                    B: { fields: {}, groups: [] },
                    T: { fields: {}, groups: [], supercategory: true, userDefinedSubcategoriesAllowed: true }
                },
                [{ name: 'abc', domain: ['A'], range: ['B'], sameMainCategoryResource: false }], {},
                undefined, 'User');
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
            }
        );

        let pconf;
        try {
            pconf = await configLoader.go(
                {},
                {
                    Parent: { fields: {}, groups: [], userDefinedSubcategoriesAllowed: true, supercategory: true },
                    A: { fields: {}, groups: [] },
                    B: { fields: {}, groups: [] }
                },
                [
                    { name: 'r1', domain: ['A'], range: ['B'] },
                    { name: 'r2', domain: ['A'], range: ['B'] }
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

        expect(pconf.getRelationDefinitionsForDomainCategory('A')[1].label.de).toEqual('r1_');
        expect(pconf.getRelationDefinitionsForDomainCategory('A')[0].label).toEqual({});

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
            'A': { fields: { fieldA1: { } }, groups: [] },
            'B': { fields: { fieldB2: { inputType: 'boolean' } }, groups: [] },
            'F': { fields: {}, groups: [] },
            'G': { fields: {}, groups: [] }
        };

        applyConfig(
            customCategories,
            {},
            {}
        );

        let pconf;
        try {
            pconf = await configLoader.go({},
                {
                    'F': { fields: {}, groups: [], userDefinedSubcategoriesAllowed: true, supercategory: true },
                    'G': { fields: {}, groups: [], userDefinedSubcategoriesAllowed: true, supercategory: true }},[], {},
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

        Object.assign(libraryCategories, {
            'Find:0': {
                categoryName: 'Find',
                commons: [],
                valuelists: {},
                fields: { fieldA1: { inputType: 'unsignedInt' } },
                groups: [
                    { name: Groups.STEM, fields: ['fieldA1'] }
                ],
                creationDate: '',
                createdBy: '',
                description: {}
            }
        });

        const customCategories: Map<CustomCategoryDefinition> = {
            'B:0': {
                parent: 'Find',
                fields: { fieldB1: { inputType: 'boolean'} },
                groups: [
                    { name: Groups.STEM, fields: ['fieldA1', 'fieldB1'] }
                ]
            },
            'Find:0': { fields: {}, groups: [] }
        };

        applyConfig(
            customCategories,
            {},
            {}
        );

        let pconf;
        try {
            pconf = await configLoader.go({},
                {
                    'Find': {
                        fields: {},
                        groups: [],
                        userDefinedSubcategoriesAllowed: true,
                        supercategory: true
                    }
                },
                [], {}, undefined, 'User'
            );

            expect(Named.arrayToMap<Category>(pconf.getCategoriesArray())['B:0']
                .groups[0].fields
                .find(field => field.name == 'fieldB1').inputType)
                .toEqual('boolean');

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
                fields: { fieldC1: { inputType: 'boolean'} }
            }
        };

        applyConfig(
            customFieldsConfiguration,
            {},
            {}
        );

        try {
            await configLoader.go({}, {},[], {},
                undefined, 'User'
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
                fields: { fieldC1: { inputType: 'boolean'} }
            }
        };

        applyConfig(customFieldsConfiguration);

        try {
            await configLoader.go({},
                { Place: { fields: { fieldA1: { inputType: 'unsignedInt' } }, groups: [] } },
                [], {}, undefined, 'User');
            fail();
        } catch(err) {
            expect(err).toEqual([ConfigurationErrors.TRYING_TO_SUBTYPE_A_NON_EXTENDABLE_CATEGORY, 'Place']);
        }

        done();
    });


    it('apply groups configuration', async done => {

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
                groups: [
                    { name: Groups.STEM, fields: ['fieldB1', 'fieldB2'] },
                    { name: Groups.PARENT, fields: ['fieldB3'] }
                ],
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
                groups: [
                    { name: Groups.STEM, fields: ['fieldC1'] },
                    { name: Groups.PARENT, fields: ['fieldC2'] }
                ],
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
                groups: [
                    // Ignore fields defined in groups but not in fields configuration
                    { name: Groups.STEM, fields: ['fieldA1', 'fieldA2', 'fieldA3'] },
                    { name: Groups.PARENT, fields: ['fieldA4', 'fieldA5'] }
                ],
                creationDate: '', createdBy: '', description: {}
            }
        });

        applyConfig(
            { 'A': { fields: {} }, 'B': { fields: {} }, 'C': { fields: {} }, 'Parent': { fields: {} } },
            {}, {},
        );

        let pconf;
        try {
            pconf = await configLoader.go({},
                { Parent: { fields: {}, groups: [], userDefinedSubcategoriesAllowed: true, supercategory: true } },
                [], {},
                undefined, 'User'
            );

            const result = Named.arrayToMap<Category>(pconf.getCategoriesArray());

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
                groups: [
                    { name: Groups.STEM, fields: ['fieldA1', 'fieldA2', 'fieldA1']}
                ],
                creationDate: '', createdBy: '', description: {}
            }
        });

        applyConfig({ A: { fields: {} }, Parent: { fields: {} } },
            {}, {}
        );

        let pconf;
        try {
            pconf = await configLoader.go({},
                { Parent: { fields: {}, groups: [], supercategory: true, userDefinedSubcategoriesAllowed: true } },
                [], {}, undefined, 'User'
            );

            expect(pconf.getCategoriesArray().length).toBe(2);
            expect(pconf.getCategory('A').groups[0].fields.length).toBe(2);
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
            }
        );

        let pconf;
        try {
            pconf = await configLoader.go({}, { A: { fields: {}, groups: [] } }, [], {},
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

        Object.assign(libraryCategories, {
            'A:0': {
                categoryName: 'A',
                commons: [],
                valuelists: {},
                fields: {},
                creationDate: '',
                createdBy: '',
                description: {}
            }
        });

        applyConfig(
            {
                'A:0': { fields: {} },
                B: { fields: {} },
                C: { parent: 'A', fields: {} }
            },
            {}, {}
        );

        let pconf;
        try {
            pconf = await configLoader.go(
                {},
                {
                    A: { fields: {}, groups: [], userDefinedSubcategoriesAllowed: true, supercategory: true },
                    B: { fields: {}, groups: [] }
                },
                [],
                {},
                undefined,
                'User'
            );
        } catch(err) {
            fail(err);
        }

        expect(pconf.getCategory('A').libraryId).toBe('A:0');
        expect(pconf.getCategory('B').libraryId).toBe('B');
        expect(pconf.getCategory('C').libraryId).toBeUndefined();
        
        done();
    });
});
