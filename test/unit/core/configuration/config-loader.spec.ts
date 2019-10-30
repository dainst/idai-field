import {ConfigurationValidation} from '../../../../app/core/configuration/configuration-validation';
import {ConfigurationDefinition} from '../../../../app/core/configuration/configuration-definition';
import {ConfigLoader} from '../../../../app/core/configuration/config-loader';
import {CustomTypeDefinitionsMap} from '../../../../app/core/configuration/model/custom-type-definition';
import {ConfigurationErrors} from '../../../../app/core/configuration/configuration-errors';


/**
 * @author Daniel de Oliveira
 * @author Thomas Kleinke
 */
describe('ConfigLoader', () => {

    let libraryTypes = {} as ConfigurationDefinition;
    let configLoader: ConfigLoader;
    let configReader;


    function applyConfig(
        customFieldsConfiguration = {},
        languageConfiguration = {},
        customLanguageConfiguration = {},
        orderConfiguration = {}) {

        configReader.read.and.returnValues(
            Promise.resolve(libraryTypes),
            Promise.resolve(customFieldsConfiguration),
            Promise.resolve(languageConfiguration),
            Promise.resolve(customLanguageConfiguration),
            Promise.resolve({}),
            Promise.resolve({}),
            Promise.resolve(orderConfiguration),
        );
    }


    beforeEach(() => {

        libraryTypes = {} as ConfigurationDefinition;

        configReader = jasmine.createSpyObj('confRead', ['read']);
        applyConfig();

        configLoader = new ConfigLoader(configReader, () => '');
    });


    it('mix in common fields', async done => {

        Object.assign(libraryTypes, {
            'B:0': {
                typeFamily: 'B',
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
                types: {
                    B: { label: 'B_', fields: { processor: { label: 'Bearbeiter/Bearbeiterin', description: 'abc' }} },
                }, relations: {},
            },
            {},
            {});

        let pconf;
        try {
            pconf = await configLoader.go(
                'yo',
                { processor : { inputType: 'input', group: 'stem' }},
                { 'A': { fields: {}, userDefinedSubtypesAllowed: true, superType: true } },
                [],
                {},
                undefined,
                'de'
            );
        } catch(err) {
            fail(err);
            done();
        }

        expect(pconf.getTypesList()[1]['fields'][2]['name']).toBe('processor');
        done();
    });


    it('translate common fields', async done => {

        Object.assign(libraryTypes, {
            'B:0': {
                typeFamily: 'B',
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
                types: {},
                relations: {}
            },
            {},
            {});

        let pconf;
        try {
            pconf = await configLoader.go(
                'yo',
                { processor : { inputType: 'input', group: 'stem' }},
                { 'A': { fields: {}, superType: true, userDefinedSubtypesAllowed: true }},
                [],
                {},
                undefined,
                'de'
            );
        } catch(err) {
            console.log('err',err);
            fail(err);
            done();
        }
        expect(pconf.getTypesList()[1]['fields'][2]['label']).toBe('Bearbeiter/Bearbeiterin');
        expect(pconf.getTypesList()[1]['fields'][2]['description']).toBe('abc');
        done();
    });


    it('mix existing externally configured with internal inherits relation', async done => {

        Object.assign(libraryTypes, {
            'A1': { typeFamily: 'A1', parent: 'A', fields: {}, valuelists: {}, creationDate: '', createdBy: '', description: {}, commons: [] },
            'A2': { typeFamily: 'A2', parent: 'A', fields: {}, valuelists: {}, creationDate: '', createdBy: '', description: {}, commons: [] },
            'B1': { typeFamily: 'B1', parent: 'B', fields: {}, valuelists: {}, creationDate: '', createdBy: '', description: {}, commons: [] },
            'B2': { typeFamily: 'B2', parent: 'B', fields: {}, valuelists: {}, creationDate: '', createdBy: '', description: {}, commons: [] }
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
                'yo',
                {},
                {
                    'A': { fields: {}, superType: true, userDefinedSubtypesAllowed: true},
                    'B': { fields: {}, superType: true, userDefinedSubtypesAllowed: true},
                    'C': { fields: {}},
                    'D': { fields: {}}
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
                'de'
            );
        } catch(err) {
            fail(err);
            done();
        }
        
        expect((pconf.getRelationDefinitions('A') as any)[0].range).toContain('B1');
        expect((pconf.getRelationDefinitions('A1') as any)[0].range).toContain('B');
        expect((pconf.getRelationDefinitions('A2') as any)[0].range).toContain('B2');
        expect((pconf.getRelationDefinitions('C') as any)[0].range).toContain('D');
        done();
    });


    it('preprocess - convert sameOperation to sameMainTypeResource', async done => {

        Object.assign(libraryTypes, {
            'A': { typeFamily: 'A', parent: 'T', fields: {}, valuelists: {}, creationDate: '', createdBy: '', description: {}, commons: []  },
            'B': { typeFamily: 'B', parent: 'T', fields: {}, valuelists: {}, creationDate: '', createdBy: '', description: {}, commons: []  }});

        applyConfig(
            { 'A': { fields: {} }, 'B': { fields: {} }, 'T': { fields: {} }});

        let pconf;
        try {
            pconf = await configLoader.go(
                'yo',
                {},
                {
                    A: { fields: {}},
                    B: { fields: {}},
                    T: { fields: {}, superType: true, userDefinedSubtypesAllowed: true }},
                [{ name: 'abc', domain: ['A'], range: ['B'], sameMainTypeResource: false }], {},
                undefined, 'de');
        } catch(err) {
            fail(err);
            done();
        }

        expect(pconf.getRelationDefinitions('A')[0].sameMainTypeResource).toBe(false);
        done();
    });


    it('preprocess - apply language confs', async done => {

        Object.assign(libraryTypes, {
            'A': { typeFamily: 'A', parent: 'Parent', fields: {}, valuelists: {}, creationDate: '', createdBy: '', description: {}, commons: [] },
            'B': { typeFamily: 'B', parent: 'Parent', fields: {}, valuelists: {}, creationDate: '', createdBy: '', description: {}, commons: [] },
            'C': { typeFamily: 'C', parent: 'Parent', fields: {}, valuelists: {}, creationDate: '', createdBy: '', description: {}, commons: []  }
        });

        applyConfig(
            {
                'A': { fields: {} },
                'B': { fields: {} },
                'C': { fields: {} },
                'Parent': { fields: {} }
                },
            {
            types: {
                A: { label: 'A_' },
                B: { label: 'B_' }
            },
            relations: {
                r1: { label: 'r1_' }
            }
            }, {
                types: {
                    B: { label: 'B__' }
                }
            },
            {});

        let pconf;
        try {
            pconf = await configLoader.go(
                'yo', {},
                {
                        Parent: { fields: {}, userDefinedSubtypesAllowed: true, superType: true },
                        A: { fields: {} },
                        B: { fields: {} }
                    },
                [{ name: 'r1', domain: ['A'], range: ['B']},
                         { name: 'r2', domain: ['A'], range: ['B']}],
                {},
                 undefined, 'de');
        } catch(err) {
            fail(err);
            done();
        }

        expect(pconf.getTypesList()[1].label).toEqual('A_');
        expect(pconf.getTypesList()[2].label).toEqual('B__');
        expect(pconf.getTypesList()[3].label).toEqual('C'); // took name as label

        expect(pconf.getRelationDefinitions('A')[1].label).toEqual('r1_');
        expect(pconf.getRelationDefinitions('A')[0].label).toBeUndefined();
        done();
    });


    it('preprocess - apply custom fields configuration', async done => {

        Object.assign(libraryTypes, {
            'A': {
                typeFamily: 'A',
                commons: [],
                valuelists: {},
                parent: 'F',
                fields: { fieldA1: { inputType: 'unsignedInt' } },
                creationDate: '',
                createdBy: '',
                description: {}
                },
            'B': {
                typeFamily: 'B',
                commons: [],
                valuelists: {},
                parent: 'G',
                fields: { fieldB1: { inputType: 'input' } },
                creationDate: '',
                createdBy: '',
                description: {}
            }
        });

        const customTypes: CustomTypeDefinitionsMap = {
            'A': { fields: { fieldA1: { } } },
            'B': { fields: { fieldB2: { inputType: 'boolean' } } },
            'F': { fields: {} },
            'G': { fields: {} }
        };

        applyConfig(
            customTypes,
            {},
            {},
            {});

        let pconf;
        try {
            pconf = await configLoader.go('', {},
                {
                    'F': { fields: {}, userDefinedSubtypesAllowed: true, superType: true },
                    'G': { fields: {}, userDefinedSubtypesAllowed: true, superType: true }},[], {},
                undefined, 'de'
            );

            expect(pconf.getTypesList()[2].fields.find(field => field.name == 'fieldA1')
                .inputType).toEqual('unsignedInt');
            expect(pconf.getTypesList()[3].fields.find(field => field.name == 'fieldB1')
                .inputType).toEqual('input');
            expect(pconf.getTypesList()[3].fields.find(field => field.name == 'fieldB2')
                .inputType).toEqual('boolean');

        } catch(err) {
            fail(err);
        } finally {
            done();
        }
    });


    it('preprocess - apply custom fields configuration - add subtypes', async done => {

        Object.assign(libraryTypes, {
            'Find:0': {
                typeFamily: 'Find',
                commons: [],
                valuelists: {},
                fields: { fieldA1: { inputType: 'unsignedInt' } },
                creationDate: '',
                createdBy: '',
                description: {}
            }
        });

        const customTypes: CustomTypeDefinitionsMap = {
            'B:0': {
                parent: 'Find',
                fields: { fieldC1: { inputType: 'boolean'} }
            },
            'Find:0': { fields: {} }
        };

        applyConfig(
            customTypes,
            {},
            {},
            {});

        let pconf;
        try {
            pconf = await configLoader.go('', {},
                { 'Find': { fields: {}, userDefinedSubtypesAllowed: true, superType: true }},[], {},
                undefined, 'de'
            );

            expect(pconf.getTypesList()[1].fields.find(field => field.name == 'fieldC1')
                .inputType).toEqual('boolean');

        } catch(err) {
            fail(err);
        } finally {
            done();
        }
    });


    it('preprocess - apply custom fields configuration - add subtypes - parent not defined', async done => {

        Object.assign(libraryTypes, {});

        const customFieldsConfiguration = {
            'B:0': {
                parent: 'Find',
                commons: [],
                valuelists: {},
                fields: { fieldC1: { inputType: 'boolean'}},
                creationDate: '',
                createdBy: '',
                description: {}
            }
        };

        applyConfig(
            customFieldsConfiguration,
            {},
            {},
            {}
        );

        try {
            await configLoader.go('', {}, {},[], {},
                undefined, 'de'
            );

            fail();
        } catch(err) {
            expect(err).toEqual([[ConfigurationErrors.INVALID_CONFIG_PARENT_NOT_DEFINED, 'Find']]);
        } finally {
            done();
        }
    });


    it('preprocess - apply custom fields configuration - add subtypes - non extendable types not allowed', async done => {

        Object.assign(libraryTypes, {});

        const customFieldsConfiguration = {
            'Extension:0': {
                parent: 'Place',
                commons: [],
                valuelists: {},
                fields: { fieldC1: { inputType: 'boolean'}},
                creationDate: '',
                createdBy: '',
                description: {} }
        };

        applyConfig(customFieldsConfiguration);

        try {
            await configLoader.go('', {}, { Place: { fields: { fieldA1: { inputType: 'unsignedInt' }}}},[], {},
                undefined, 'de'
            );
            fail();

        } catch(err) {
            expect(err).toEqual([[ConfigurationErrors.TRYING_TO_SUBTYPE_A_NON_EXTENDABLE_TYPE, 'Place']]);
        } finally {
            done();
        }
    });


    it('apply order configuration', async done => {

        Object.assign(libraryTypes, {
            'B': {
                typeFamily: 'B',
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
                typeFamily: 'C',
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
                typeFamily: 'A',
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
                types: ['A', 'B', 'C'],
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
            pconf = await configLoader.go('', {},
                { Parent: { fields: {}, userDefinedSubtypesAllowed: true, superType: true }},
                [], {},
                 undefined, 'de'
            );

            expect(pconf.getTypesList()[0].name).toEqual('A');
            expect(pconf.getTypesList()[0].fields[2].name).toEqual('fieldA1');
            expect(pconf.getTypesList()[0].fields[3].name).toEqual('fieldA2');
            expect(pconf.getTypesList()[1].name).toEqual('B');
            expect(pconf.getTypesList()[1].fields[2].name).toEqual('fieldB1');
            expect(pconf.getTypesList()[1].fields[3].name).toEqual('fieldB2');
            expect(pconf.getTypesList()[1].fields[4].name).toEqual('fieldB3');
            expect(pconf.getTypesList()[2].name).toEqual('C');
            expect(pconf.getTypesList()[2].fields[2].name).toEqual('fieldC1');
            expect(pconf.getTypesList()[2].fields[3].name).toEqual('fieldC2');

            done();
        } catch(err) {
            fail(err);
            done();
        }
    });


    it('add types and fields only once even if they are mentioned multiple times in order configuration',
        async done => {

        Object.assign(libraryTypes, {
            A: {
                typeFamily: 'A',
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

        applyConfig({ 'A': { fields: {} }, 'Parent': { fields: {} } },
            {}, {}, {
                types: ['A', 'A'],
                fields: {
                    'A': ['fieldA1', 'fieldA2', 'fieldA1']
                }
            });

        let pconf;
        try {
            pconf = await configLoader.go('', {},
                { Parent: { fields: {}, superType: true, userDefinedSubtypesAllowed: true }}, [], {},
                undefined, 'de'
            );

            expect(pconf.getTypesList().length).toBe(2);
            expect(pconf.getTypesList()[0].fields.length).toBe(4);  // fieldA1, fieldA2, id, type
            expect(pconf.getTypesList()[0].fields[2].name).toEqual('fieldA1');
            expect(pconf.getTypesList()[0].fields[3].name).toEqual('fieldA2');

            done();
        } catch(err) {
            fail(err);
            done();
        }
    });


    it('apply hidden', async done => {

        Object.assign(libraryTypes, {
            'A:0': {
                typeFamily: 'A',
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
            pconf = await configLoader.go('', {}, { A: { fields: {} }}, [], {},
                undefined, 'de'
            );

            expect(pconf.getTypesList()[0].fields[0].name).toEqual('fieldA1');
            expect(pconf.getTypesList()[0].fields[0].visible).toBe(false);
            expect(pconf.getTypesList()[0].fields[0].editable).toBe(false);
            expect(pconf.getTypesList()[0].fields[1].name).toEqual('fieldA2');
            expect(pconf.getTypesList()[0].fields[1].visible).toBe(false);
            expect(pconf.getTypesList()[0].fields[1].editable).toBe(false);
            expect(pconf.getTypesList()[0].fields[2].name).toEqual('fieldA3');
            expect(pconf.getTypesList()[0].fields[2].visible).toBe(true);
            expect(pconf.getTypesList()[0].fields[2].editable).toBe(true);

            done();
        } catch(err) {
            fail(err);
            done();
        }
    });
});