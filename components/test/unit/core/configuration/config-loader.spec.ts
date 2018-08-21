import {ConfigurationDefinition} from '../../../../src/core/configuration/configuration-definition';
import {ConfigLoader} from '../../../../src/core/configuration/config-loader';
import {
    IdaiFieldPrePreprocessConfigurationValidator
} from '../../../../src/core/configuration/idai-field-pre-preprocess-configuration-validator';
import {ConfigurationValidator} from '../../../../src/core/configuration/configuration-validator';
import {FieldDefinition} from '../../../../src/core/configuration/field-definition';

/**
 * @author Daniel de Oliveira
 * @author Thomas Kleinke
 */
describe('ConfigLoader', () => {

    const configuration = {} as ConfigurationDefinition;
    let configLoader: ConfigLoader;
    let configReader;


    beforeEach(() => {

        configReader = jasmine.createSpyObj(
            'confRead', ['read']);
        configReader.read.and.returnValues(
            Promise.resolve(configuration),
            Promise.resolve({}),
            Promise.resolve({}),
            Promise.resolve({}),
            Promise.resolve({}),
            Promise.resolve({}),
            Promise.resolve({}),
            Promise.resolve({}),
            Promise.resolve({})
        );
        configLoader = new ConfigLoader(configReader);
    });


    it('mix existing externally configured with internal inherits relation', async (done) => {

        Object.assign(configuration, {
            identifier: 'Conf',
            types: {
                'A': {},
                'B': {},
                'C': {},
                'D': {},
                'A1': { parent: 'A' },
                'A2': { parent: 'A' },
                'B1': { parent: 'B' },
                'B2': { parent: 'B' }
            },
            relations: [{
                name: 'connection',
                domain: ['C'],
                range: ['D']
            }]
        });

        let pconf;

        try {
            pconf = await configLoader.go(
                'yo',
                {},
                [{
                    name: 'connection',
                    domain: ['A:inherit'], // TODO reject config if not an array
                    range: ['B:inherit']
                }],
                {},
                [],
                new IdaiFieldPrePreprocessConfigurationValidator(),
                new ConfigurationValidator()
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


    it('preprocess - convert sameOperation to sameMainTypeResource', async (done) => {

        Object.assign(configuration, {
            identifier: 'Conf',
            types: { 'A': {}, 'B': {} },
            relations: [{ name: 'abc', domain: ['A'], range: ['B'], sameOperation: false }]
        });

        let pconf;
        try {
            pconf = await configLoader.go(
                'yo', {}, [], {}, [],
                new IdaiFieldPrePreprocessConfigurationValidator(),
                new ConfigurationValidator());
        } catch(err) {
            fail(err);
            done();
        }

        expect(pconf.getRelationDefinitions('A')[0].sameMainTypeResource).toBe(false);
        done();
    });


    it('preprocess - apply language confs', async (done) => {

        Object.assign(configuration, {
            identifier: 'Conf',
            types: {
                'A': {},
                'B': {},
                'C': {}
            },
            relations: [
                { name: 'r1', domain: ['A'], range: ['B']},
                { name: 'r2', domain: ['A'], range: ['B']}
            ]
        });

        configReader.read.and.returnValues(
            Promise.resolve(configuration),
            Promise.resolve({}),
            Promise.resolve({}),
            Promise.resolve({}),
            Promise.resolve({
                    types: {
                        A: { label: 'A_' },
                        B: { label: 'B_' }
                    },
                    relations: {
                        r1: { label: 'r1_' }
                    }
            }),
            Promise.resolve({
                types: {
                    B: { label: 'B__' }
                }
            }),
            Promise.resolve({}),
            Promise.resolve({}),
            Promise.resolve({})
        );

        let pconf;
        try {
            pconf = await configLoader.go(
                'yo', {}, [], {}, [],
                new IdaiFieldPrePreprocessConfigurationValidator(),
                new ConfigurationValidator());
        } catch(err) {
            fail(err);
            done();
        }


        expect(pconf.getTypesList()[0].label).toEqual('A_');
        expect(pconf.getTypesList()[1].label).toEqual('B__');
        expect(pconf.getTypesList()[2].label).toEqual('C'); // took name as label

        expect(pconf.getRelationDefinitions('A')[0].label).toEqual('r1_');
        expect(pconf.getRelationDefinitions('A')[1].label).toBeUndefined();
        done();
    });


    it('preprocess - apply custom fields configuration', async done => {

        Object.assign(configuration, {
            identifier: 'Conf',
            types: {
                A: { fields: { fieldA1: { inputType: 'unsignedInt' } } },
                B: { fields: { fieldB1: { inputType: 'input' } } }
            },
            relations: [
                { name: 'r1', domain: ['A'], range: ['B']},
                { name: 'r2', domain: ['A'], range: ['B']}
            ]
        });

        configReader.read.and.returnValues(
            Promise.resolve(configuration),
            Promise.resolve({
                A: { fields: { fieldA1: { inputType: 'unsignedFloat' } } },
                B: { fields: { fieldB2: { inputType: 'boolean' } } }
            }),
            Promise.resolve({}),
            Promise.resolve({}),
            Promise.resolve({}),
            Promise.resolve({}),
            Promise.resolve({}),
            Promise.resolve({}),
            Promise.resolve({})
        );

        let pconf;
        try {
            pconf = await configLoader.go('', {}, [], {}, [],
                new IdaiFieldPrePreprocessConfigurationValidator(), new ConfigurationValidator()
            );

            expect(pconf.getTypesList()[0].fields.find(field => field.name == 'fieldA1')
                .inputType).toEqual('unsignedFloat');
            expect(pconf.getTypesList()[1].fields.find(field => field.name == 'fieldB1')
                .inputType).toEqual('input');
            expect(pconf.getTypesList()[1].fields.find(field => field.name == 'fieldB2')
                .inputType).toEqual('boolean');

            done();
        } catch(err) {
            fail(err);
            done();
        }
    });


    it('apply order configuration', async done => {

        Object.assign(configuration, {
            identifier: 'Conf',
            types: {
                B: { fields: { fieldB2: {}, fieldB3: {}, fieldB1: {} } },
                C: { fields: { fieldC1: {}, fieldC2: {} } },
                A: { fields: { fieldA2: {}, fieldA1: {} } }
            },
            relations: []
        });

        configReader.read.and.returnValues(
            Promise.resolve(configuration),
            Promise.resolve({}),
            Promise.resolve({}),
            Promise.resolve({}),
            Promise.resolve({}),
            Promise.resolve({}),
            Promise.resolve({}),
            Promise.resolve({}),
            Promise.resolve({
                types: ['A', 'B', 'C'],
                fields: {
                    'A': ['fieldA1', 'fieldA2'],
                    'B': ['fieldB1', 'fieldB2', 'fieldB3'],
                    'C': ['fieldC1', 'fieldC2'],

                    // Ignore fields defined in Order.json but not in configuration silently
                    'D': ['fieldD1', 'fieldD2']
                }
            })
        );

        let pconf;
        try {
            pconf = await configLoader.go('', {}, [], {},
                [], new IdaiFieldPrePreprocessConfigurationValidator(),
                new ConfigurationValidator()
            );

            expect(pconf.getTypesList()[0].name).toEqual('A');
            expect(pconf.getTypesList()[0].fields[0].name).toEqual('fieldA1');
            expect(pconf.getTypesList()[0].fields[1].name).toEqual('fieldA2');
            expect(pconf.getTypesList()[1].name).toEqual('B');
            expect(pconf.getTypesList()[1].fields[0].name).toEqual('fieldB1');
            expect(pconf.getTypesList()[1].fields[1].name).toEqual('fieldB2');
            expect(pconf.getTypesList()[1].fields[2].name).toEqual('fieldB3');
            expect(pconf.getTypesList()[2].name).toEqual('C');
            expect(pconf.getTypesList()[2].fields[0].name).toEqual('fieldC1');
            expect(pconf.getTypesList()[2].fields[1].name).toEqual('fieldC2');

            done();
        } catch(err) {
            fail(err);
            done();
        }
    });


    it('apply extra fields order', async done => {

        Object.assign(configuration, {
            identifier: 'Conf',
            types: {
                A: { fields: { fieldA2: {}, fieldA1: {} } },
                B: { fields: { fieldB2: {}, fieldB1: {} } }
            },
            relations: []
        });

        configReader.read.and.returnValues(
            Promise.resolve(configuration),
            Promise.resolve({}),
            Promise.resolve({}),
            Promise.resolve({}),
            Promise.resolve({}),
            Promise.resolve({}),
            Promise.resolve({}),
            Promise.resolve({}),
            Promise.resolve({
                types: ['A', 'B'],
                fields: {
                    'A': ['fieldA1', 'fieldA2'],
                    'B': ['fieldB1', 'fieldB2']
                }
            })
        );

        let pconf;
        try {
            pconf = await configLoader.go('', {}, [],
                { extraField1: {} as FieldDefinition, extraField2: {} as FieldDefinition },
                ['extraField1', 'extraField2'], new IdaiFieldPrePreprocessConfigurationValidator(),
                new ConfigurationValidator()
            );

            expect(pconf.getTypesList()[0].name).toEqual('A');
            expect(pconf.getTypesList()[0].fields[0].name).toEqual('extraField1');
            expect(pconf.getTypesList()[0].fields[1].name).toEqual('extraField2');
            expect(pconf.getTypesList()[0].fields[2].name).toEqual('fieldA1');
            expect(pconf.getTypesList()[0].fields[3].name).toEqual('fieldA2');
            expect(pconf.getTypesList()[1].name).toEqual('B');
            expect(pconf.getTypesList()[1].fields[0].name).toEqual('extraField1');
            expect(pconf.getTypesList()[1].fields[1].name).toEqual('extraField2');
            expect(pconf.getTypesList()[1].fields[2].name).toEqual('fieldB1');
            expect(pconf.getTypesList()[1].fields[3].name).toEqual('fieldB2');

            done();
        } catch(err) {
            fail(err);
            done();
        }
    });


    it('apply extra fields order to an empty order configuration', async done => {

        Object.assign(configuration, {
            identifier: 'Conf',
            types: {
                A: { fields: { fieldA2: {}, fieldA1: {} } },
                B: { fields: { fieldB2: {}, fieldB1: {} } }
            },
            relations: []
        });

        configReader.read.and.returnValues(
            Promise.resolve(configuration),
            Promise.resolve({}),
            Promise.resolve({}),
            Promise.resolve({}),
            Promise.resolve({}),
            Promise.resolve({}),
            Promise.resolve({}),
            Promise.resolve({}),
            Promise.resolve({})
        );

        let pconf;
        try {
            pconf = await configLoader.go('', {}, [],
                { extraField1: {} as FieldDefinition, extraField2: {} as FieldDefinition },
                ['extraField1', 'extraField2'], new IdaiFieldPrePreprocessConfigurationValidator(),
                new ConfigurationValidator()
            );

            const typeA = pconf.getTypesList().find(type => type.name === 'A');
            const typeB = pconf.getTypesList().find(type => type.name === 'B');

            expect(typeA.fields[0].name).toEqual('extraField1');
            expect(typeA.fields[1].name).toEqual('extraField2');
            expect(typeB.fields[0].name).toEqual('extraField1');
            expect(typeB.fields[1].name).toEqual('extraField2');

            done();
        } catch(err) {
            fail(err);
            done();
        }
    });


    it('add types and fields only once even if they are mentioned multiple times in order configuration',
        async done => {

        Object.assign(configuration, {
            identifier: 'Conf',
            types: {
                A: { fields: { fieldA2: {}, fieldA1: {} } }
            },
            relations: []
        });

        configReader.read.and.returnValues(
            Promise.resolve(configuration),
            Promise.resolve({}),
            Promise.resolve({}),
            Promise.resolve({}),
            Promise.resolve({}),
            Promise.resolve({}),
            Promise.resolve({}),
            Promise.resolve({}),
            Promise.resolve({
                types: ['A', 'A'],
                fields: {
                    'A': ['fieldA1', 'fieldA2', 'fieldA1']
                }
            })
        );

        let pconf;
        try {
            pconf = await configLoader.go('', {}, [], {},
                [], new IdaiFieldPrePreprocessConfigurationValidator(),
                new ConfigurationValidator()
            );

            expect(pconf.getTypesList().length).toBe(1);
            expect(pconf.getTypesList()[0].fields.length).toBe(4);  // fieldA1, fieldA2, id, type
            expect(pconf.getTypesList()[0].fields[0].name).toEqual('fieldA1');
            expect(pconf.getTypesList()[0].fields[1].name).toEqual('fieldA2');

            done();
        } catch(err) {
            fail(err);
            done();
        }
    });
});