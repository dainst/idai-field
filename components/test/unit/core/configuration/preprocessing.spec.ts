import {Preprocessing} from '../../../../src/core/configuration/preprocessing';
import {TypeDefinition} from '../../../../src/core/configuration/type-definition'
import {RelationDefinition} from '../../../../src/core/configuration/relation-definition'
import {UnorderedConfigurationDefinition} from '../../../../src/core/configuration/unordered-configuration-definition';
import {FieldDefinition} from '../../../../src/core/configuration/field-definition';

/**
 * @author Daniel de Oliveira
 * @author Thomas Kleinke
 */

describe('ConfigurationPreprocessor', () => {

    let configuration: UnorderedConfigurationDefinition;
    let t1: TypeDefinition;

    beforeEach(() => {

        t1 = {
            color: 'white',
            fields: {
                'aField': {}
            }
        } as TypeDefinition;

        configuration = {
            identifier: 'test',
            types: {
                'T1': t1
            }
        } as any;
    });


    function addType(configuration: UnorderedConfigurationDefinition, parent?: string) {

        const newType: any = {
            fields: []
        };

        if (parent !== undefined) newType.parent = parent;
        configuration.types['T' + (Object.keys(configuration.types).length + 1)] = newType;

        return configuration;
    }

    /*
    it('should add missing relations', function() {

        delete configuration.relations; // in case someone defined it in before
        // new ConfigurationPreprocessor([])
        //     .addExtraFields(configuration);
        expect(configuration.relations.length as any).toBe(0);
    });


    it('should add missing type fields', function() {

        delete configuration.types[0].fields;
        new ConfigurationPreprocessor([])
            .addExtraFields(configuration);
        expect(configuration.types[0].fields.length).toBe(0);
    });
    */


    it('should add extra fields', () => {

        Preprocessing.addExtraFields(configuration, { 'identifier': {} as FieldDefinition });

        expect(configuration.types['T1'].fields['identifier']).toBeDefined();
        expect(configuration.types['T1'].fields['aField']).toBeDefined();
    });


    it('should add extra type', () => {

        const extraTypes = {
            T2: {
                fields: {
                    bField: {}
                }
            } as TypeDefinition
        };

        Preprocessing.addExtraTypes(configuration, extraTypes);
        expect(configuration.types['T2'].fields['bField']).toBeDefined();
    });


    it('should add an extra field to an extra type', () => {

        const extraTypes = {
            T2: {
                fields: {
                    bField: {}
                }
            } as TypeDefinition
        };

        Preprocessing.addExtraTypes(configuration, extraTypes);
        Preprocessing.addExtraFields(configuration, { 'identifier': {} as FieldDefinition });

        expect(configuration.types['T2'].fields['identifier']).toBeDefined();
        expect(configuration.types['T2'].fields['bField']).toBeDefined();
    });


    it('merge fields of extra type with existing type', () => {

        const extraTypes = {
            T1: {
                abstract: true,
                fields: {
                    bField: {}
                }
            } as TypeDefinition
        };

        Preprocessing.addExtraTypes(configuration, extraTypes);

        expect(configuration.types['T1'].abstract).toBeTruthy();
        expect(configuration.types['T1'].color).toEqual('white');
        expect(configuration.types['T1'].fields['aField']).toBeDefined();
        expect(configuration.types['T1'].fields['bField']).toBeDefined();
    });


    it('merge fields of extra type with existing type and add extra field', () => {

        const extraTypes = {
            T1: {
                fields: {
                    bField: {}
                }
            } as TypeDefinition
        };

        Preprocessing.addExtraTypes(configuration, extraTypes);
        Preprocessing.addExtraFields(configuration, { 'identifier': {} as FieldDefinition });

        expect(configuration.types['T1'].fields['aField']).toBeDefined();
        expect(configuration.types['T1'].fields['bField']).toBeDefined();
        expect(configuration.types['T1'].fields['identifier']).toBeDefined();
    });


    it('should not add extra fields to subtypes', () => {

        const t: TypeDefinition = {
            parent: 'SuperT',
            fields: {
                aField: {}
            }
        } as TypeDefinition;

        configuration = {
            identifier: 'test',
            types: {
                T1: t
            },
            relations: []
        };

        Preprocessing.addExtraTypes(configuration, {});
        Preprocessing.addExtraFields(configuration, { 'identifier': {} as FieldDefinition });

        expect(configuration.types['T1'].fields['aField']).toBeDefined();
        expect(configuration.types['T1'].fields['identifier']).toBeUndefined();
    });


    it('should add an extra relation', function() {

        const extraRelation: RelationDefinition = {
            name: 'R',
            domain: ['domainA'],
            range : ['rangeA']
        };
        configuration.relations = [];

        Preprocessing.addExtraFields(configuration, {});
        Preprocessing.addExtraRelations(configuration, [extraRelation]);

        expect(configuration.relations[0].name).toBe('R');
        expect(configuration.relations[1]).toBe(undefined); // to prevent reintroducing bug
    });


    // there was a bug where relation was not added if one of the same name but with a different domain was configured
    it('should add an extra relation to an existing relation', function() {

        const r1: RelationDefinition = {
            name: 'R',
            domain: ['domainA'],
            range : ['rangeA']
        };

        const r2: RelationDefinition = {
            name: 'R',
            domain: ['domainB'],
            range : ['rangeA']
        };

        configuration = {
            identifier: 'test',
            types: {
                T1: t1
            },
            relations: [
                r1
            ]
        };

        Preprocessing.addExtraTypes(configuration, {});
        Preprocessing.addExtraFields(configuration, {});
        Preprocessing.addExtraRelations(configuration, [r2]);

        expect(configuration.relations.length).toBe(2);
    });


    it('should replace range ALL with all types except the domain types', function() {

        const r: RelationDefinition = {
            name: 'R',
            domain: ['T2', 'T3']
        };

        configuration.relations = [];

        Preprocessing.addExtraFields(addType(addType(configuration)), {});
        Preprocessing.addExtraRelations(configuration, [r]);

        expect(configuration.relations[0].range[0]).toBe('T1');
        expect(configuration.relations[0].range[1]).toBe(undefined);
    });


    it('should replace domain ALL with all types except the range types', function() {

        const r: RelationDefinition = {
            name: 'R',
            range: ['T2', 'T3']
        };

        configuration.relations = [];

        Preprocessing.addExtraFields(addType(addType(configuration)), {});
        Preprocessing.addExtraRelations(configuration, [r]);

        expect(configuration.relations[0].domain[0]).toBe('T1');
        expect(configuration.relations[0].domain[1]).toBe(undefined);
    });


    it('should replace range :inherit with all subtypes', function() {

        const r: RelationDefinition = { name: 'R',
            domain: [ 'T3' ],
            range: [ 'T1:inherit' ]
        };

        configuration.relations = [];

        Preprocessing.addExtraFields(addType(addType(configuration,'T1')), {});
        Preprocessing.addExtraRelations(configuration, [r]);

        expect(configuration.relations[0].range.indexOf('T1')).not.toBe(-1);
        expect(configuration.relations[0].range.indexOf('T2')).not.toBe(-1);
        expect(configuration.relations[0].range.indexOf('T1:inherit')).toBe(-1);
        expect(configuration.relations[0].domain[0]).toBe('T3');
    });


    it('should replace domain :inherit with all subtypes', function() {

        const r: RelationDefinition = { name: 'R',
            domain: [ 'T1:inherit' ],
            range: [ 'T3' ]
        };

        configuration.relations = [];

        Preprocessing.addExtraFields(addType(addType(configuration,'T1')), {});
        Preprocessing.addExtraRelations(configuration, [r]);

        expect(configuration.relations[0].domain.indexOf('T1')).not.toBe(-1);
        expect(configuration.relations[0].domain.indexOf('T2')).not.toBe(-1);
        expect(configuration.relations[0].domain.indexOf('T1:inherit')).toBe(-1);
        expect(configuration.relations[0].range[0]).toBe('T3');
    });


    // This test can detect problems coming from a wrong order of expandInherits and expandAllMarker calls
    it('should exclude the type and subtypes when using :inherit and total range', function() {

        const r: RelationDefinition = { name: 'R',
            domain: [ 'T1:inherit' ]
        };

        configuration.relations = [];
        Preprocessing.addExtraFields(addType(addType(configuration,'T1')), {});
        Preprocessing.addExtraRelations(configuration, [r]);

        expect(configuration.relations[0].range[0]).toBe('T3');
        expect(configuration.relations[0].range.indexOf('T1')).toBe(-1);
        expect(configuration.relations[0].range.indexOf('T2')).toBe(-1);
    });


    it('apply language', () => {

        configuration = {
            identifier: 'test',
            types: {
                A: { fields: { a: {}, a1: {} } } as TypeDefinition,
                B: { fields: { b: {} } } as TypeDefinition
            },
            relations: [{ name: 'isRecordedIn' }, { name: 'isContemporaryWith' }]
        };

        const languageConfiguration = {
            types: {
                A: {
                    label: 'A_',
                    fields: {
                        a: {
                            label: 'a_'
                        },
                        a1: {
                            description: 'a1_desc'
                        }
                    }
                }
            },
            relations: {
                isRecordedIn: {
                    label: 'isRecordedIn_'
                }
            }
        };

        Preprocessing.applyLanguage(configuration, languageConfiguration);

        expect(configuration.types['A'].label).toEqual('A_');
        expect(configuration.types['B'].label).toBeUndefined();
        expect(configuration.types['A'].fields['a'].label).toEqual('a_');
        expect(configuration.types['A'].fields['a1'].label).toBeUndefined();
        expect(configuration.types['A'].fields['a'].description).toBeUndefined();
        expect(configuration.types['A'].fields['a1'].description).toEqual('a1_desc');
        expect(configuration.relations[0].label).toEqual('isRecordedIn_');
        expect(configuration.relations[1].label).toBeUndefined();
    });


    it('apply search configuration', () => {

        configuration = {
            identifier: 'test',
            types: {
                A: { fields: { a1: {}, a2: {}, a3: {} } } as TypeDefinition
            },
            relations: []
        };

        const searchConfiguration = {
            'A': {
                'fulltext': ['a1', 'a3'],
                'constraint': ['a2', 'a3']
            }
        };

        Preprocessing.applySearchConfiguration(configuration, searchConfiguration);

        expect(configuration.types['A'].fields['a1'].fulltextIndexed).toBeTruthy();
        expect(configuration.types['A'].fields['a2'].fulltextIndexed).toBeFalsy();
        expect(configuration.types['A'].fields['a3'].fulltextIndexed).toBeTruthy();
        expect(configuration.types['A'].fields['a1'].constraintIndexed).toBeFalsy();
        expect(configuration.types['A'].fields['a2'].constraintIndexed).toBeTruthy();
        expect(configuration.types['A'].fields['a3'].constraintIndexed).toBeTruthy();
    });
});
