import {ProjectConfiguration} from 'idai-components-2';
import {Validator} from '../../../../app/core/model/validator';
import {TypeUtility} from '../../../../app/core/model/type-utility';
import {ValidationErrors} from '../../../../app/core/model/validation-errors';

/**
 * @author Daniel de Oliveira
 * @author Thomas Kleinke
 */
describe('Validator', () => {

    const projectConfiguration = new ProjectConfiguration(
        {
            types: [
                {
                    type: 'T',
                    fields: [
                        {name: 'id',},
                        {name: 'identifier'},
                        {name: 'type',},
                        {name: 'optional'},
                        {name: 'mandatory', mandatory: true},
                        {name: 'number1', label: 'number1', inputType: 'float'},
                        {name: 'number2', label: 'number2', inputType: 'float'}
                    ]
                },
                {
                    type: 'T2',
                    fields: [
                        {name: 'id',},
                        {name: 'type',}
                    ]
                },
            ],
            relations: [
                {name: 'isRelatedTo', domain: ['T'], range: ['T'], inverse: 'NO-INVERSE'},
                {name: 'isDepictedIn', domain: ['T'], range: ['T2'], inverse: 'NO-INVERSE'},
                {name: 'isRecordedIn', domain: ['T'], range: ['T2'], inverse: 'NO-INVERSE'}
            ]
        }
    );


    it('should report nothing', async done => {

        const datastore = jasmine.createSpyObj('datastore',['find']);
        datastore.find.and.returnValues(Promise.resolve({totalCount: 0, documents: []}));

        const doc = {
            resource: {
                id: '1',
                type: 'T',
                mandatory: 'm',
                relations: {
                    isRelatedTo: ['2']
                },
            }
        };
        await new Validator(projectConfiguration, datastore, new TypeUtility(projectConfiguration))
            .assertIsRecordedInTargetsExists(doc).then(() => done(), msgWithParams => fail(msgWithParams));
        done();
    });


    it('should report missing isRecordedInTarget', async done => {

        const datastore = jasmine.createSpyObj('datastore',['find']);
        datastore.find.and.returnValues(Promise.resolve({documents: []}));

        const doc = {resource: {id: '1', type: 'T', mandatory: 'm', relations: {'isRecordedIn': ['notexisting']}}};

        try {
            await new Validator(projectConfiguration, datastore, new TypeUtility(projectConfiguration))
                .assertIsRecordedInTargetsExists(doc);
            fail();
        } catch (expected) {
            expect(expected).toEqual([ValidationErrors.NO_ISRECORDEDIN_TARGET, 'notexisting']);
        }
        done();
    });


    it('should report duplicate identifier', async done => {

        const datastore = jasmine.createSpyObj('datastore',['find']);
        datastore.find.and.returnValues(
            Promise.resolve({totalCount: 1, documents: [{resource: {id: '2', identifier: 'eins' }}]}));

        const doc = {
            resource: {
                id: '1', identifier: 'eins', type: 'T', mandatory: 'm', relations: {'isRecordedIn': []}}
        };

        try {
            await new Validator(projectConfiguration, datastore, new TypeUtility(projectConfiguration)).assertIdentifierIsUnique(doc);
            fail();
        } catch (expected) {
            expect(expected).toEqual([ValidationErrors.IDENTIFIER_ALREADY_EXISTS, 'eins']);
        }
        done();
    });



    it('should report nothing when omitting optional property', () => {

        const datastore = jasmine.createSpyObj('datastore',['find']);
        datastore.find.and.returnValues(Promise.resolve({totalCount: 0, documents: []}));

        const doc = {
            resource: {
                id: '1',
                type: 'T',
                mandatory: 'm',
                relations: {isRecordedIn: ['0']},
            }
        };


        try {
            new Validator(projectConfiguration, undefined, new TypeUtility(projectConfiguration)).assertNoFieldsMissing(doc);
        } catch (errWithParams) {
            fail(errWithParams);
        }
        try {
            new Validator(projectConfiguration, undefined, new TypeUtility(projectConfiguration)).assertIsWellformed(doc);
        } catch (errWithParams) {
            fail(errWithParams);
        }
    });


    it('should report error when omitting mandatory property', () => {

        const doc = {
            resource: {
                id: '1',
                type: 'T',
                relations: {},
            }
        };

        try {
            new Validator(projectConfiguration, undefined, new TypeUtility(projectConfiguration)).assertNoFieldsMissing(doc);
            fail();
        } catch (errWithParams) {
            expect(errWithParams).toEqual([ValidationErrors.MISSING_PROPERTY, 'T', 'mandatory']);
        }

        try {
            new Validator(projectConfiguration, undefined, new TypeUtility(projectConfiguration)).assertIsWellformed(doc);
            fail();
        } catch (errWithParams) {
            expect(errWithParams).toEqual([ValidationErrors.MISSING_PROPERTY, 'T', 'mandatory']);
        }
    });


    it('should report error when leaving mandatory property empty', () => {

        const doc = {
            resource: {
                id: '1',
                type: 'T',
                mandatory: '',
                relations: {},
            }
        };

        try {
            new Validator(projectConfiguration, undefined, new TypeUtility(projectConfiguration)).assertNoFieldsMissing(doc);
            fail();
        } catch (errWithParams) {
            expect(errWithParams).toEqual([ValidationErrors.MISSING_PROPERTY, 'T', 'mandatory']);
        }

        try {
            new Validator(projectConfiguration, undefined, new TypeUtility(projectConfiguration)).assertIsWellformed(doc);
            fail();
        } catch (errWithParams) {
            expect(errWithParams).toEqual([ValidationErrors.MISSING_PROPERTY, 'T', 'mandatory']);
        }
    });


    it('should report a missing field definition', () => {

        const doc = {
            resource: {
                id: '1',
                type: 'T',
                a: 'b',
                mandatory: 'm',
                relations: {},
            }
        };

        try {
            new Validator(projectConfiguration, undefined, new TypeUtility(projectConfiguration))
                .assertIsWellformed(doc);
            fail();
        } catch (errWithParams) {

            expect(errWithParams).toEqual([ValidationErrors.INVALID_FIELDS, 'T', 'a']);
        }
    });


    it('should report missing field definitions', () => {

        const doc = {
            resource: {
                id: '1',
                type: 'T',
                a: 'b',
                b: 'a',
                mandatory: 'm',
                relations: {},
            }
        };

        try {
            new Validator(projectConfiguration, undefined, new TypeUtility(projectConfiguration))
                .assertIsWellformed(doc);
            fail();
        } catch (errWithParams) {

            expect(errWithParams).toEqual([ValidationErrors.INVALID_FIELDS, 'T', 'a, b']);
        }
    });


    it('should report a missing relation field definition', () => {

        const doc = {
            resource: {
                id: '1',
                type: 'T2',
                relations: {
                    isRelatedTo: ['2']
                }
            }
        };

        try {
            new Validator(projectConfiguration, undefined, new TypeUtility(projectConfiguration))
                .assertIsWellformed(doc);
            fail();
        } catch (errWithParams) {

            expect(errWithParams).toEqual([ValidationErrors.INVALID_RELATIONS, 'T2',
                'isRelatedTo']);
        }
    });


    it('should report missing relation field definitions', () => {

        const doc = {
            resource: {
                id: '1',
                type: 'T2',
                relations: {
                    isRelatedTo: ['2'],
                    isDepictedIn: ['3']
                }
            }
        };

        try {
            new Validator(projectConfiguration, undefined, new TypeUtility(projectConfiguration))
                .assertIsWellformed(doc);
            fail();
        } catch (errWithParams) {

            expect(errWithParams).toEqual([ValidationErrors.INVALID_RELATIONS, 'T2',
                'isRelatedTo, isDepictedIn']);
        }
    });


    it('should report invalid numeric field', async done => {

        const doc = {
            resource: {
                id: '1',
                type: 'T',
                mandatory: 'm',
                number1: 'ABC',
                relations: {isRecordedIn: ['0']}
            }
        };

        try {
            new Validator(projectConfiguration, undefined, new TypeUtility(projectConfiguration))
                .assertCorrectnessOfNumericalValues(doc);
            fail();
        } catch (errWithParams) {
            expect(errWithParams).toEqual([ValidationErrors.INVALID_NUMERICAL_VALUES, 'T', 'number1'])
        }
        try {
            await new Validator(projectConfiguration, undefined, new TypeUtility(projectConfiguration))
                .assertIsWellformed(doc);
            fail();
        } catch (errWithParams) {
            expect(errWithParams).toEqual([ValidationErrors.INVALID_NUMERICAL_VALUES, 'T', 'number1'])
        }
        done();
    });


    it('should report invalid numeric fields', async done => {

        const doc = {
            resource: {
                id: '1',
                type: 'T',
                mandatory: 'm',
                number1: 'ABC',
                number2: 'DEF',
                relations: {isRecordedIn: ['0']}
            }
        };

        try {
            new Validator(projectConfiguration, undefined, new TypeUtility(projectConfiguration))
                .assertCorrectnessOfNumericalValues(doc);
            fail();
        } catch (errWithParams) {
            expect(errWithParams).toEqual([ValidationErrors.INVALID_NUMERICAL_VALUES, 'T', 'number1, number2'])
        }
        try {
            await new Validator(projectConfiguration, undefined, new TypeUtility(projectConfiguration))
                .assertIsWellformed(doc);
            fail();
        } catch (errWithParams) {
            expect(errWithParams).toEqual([ValidationErrors.INVALID_NUMERICAL_VALUES, 'T', 'number1, number2'])
        }
        done();
    });
});
