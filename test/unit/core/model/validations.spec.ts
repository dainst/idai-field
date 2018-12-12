import {ProjectConfiguration} from 'idai-components-2';
import {ValidationErrors} from '../../../../app/core/model/validation-errors';
import {Validations} from '../../../../app/core/model/validations';

/**
 * @author Daniel de Oliveira
 * @author Thomas Kleinke
 */
describe('Validations', () => {

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
                        {name: 'id'},
                        {name: 'type'}
                    ]
                },
                {
                    type: 'T3',
                    fields: [
                        {name: 'id'},
                        {name: 'type'},
                        {name: 'dating'}
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


    it('validate defined fields', () => {

        const datastore = jasmine.createSpyObj('datastore',['find']);
        datastore.find.and.returnValues(Promise.resolve({totalCount: 0, documents: []}));

        const doc = {
            resource: {
                id: '1',
                type: 'T',
                mandatory: 'm',
                undef: 'abc',
                relations: {isRecordedIn: ['0']},
            }
        };

        const undefinedFields = Validations.validateDefinedFields(doc.resource, projectConfiguration);
        expect(undefinedFields).toContain('undef');
    });


    it('validate defined fields - exclude period, periodEnd if dating defined for type', () => {

        const datastore = jasmine.createSpyObj('datastore',['find']);
        datastore.find.and.returnValues(Promise.resolve({totalCount: 0, documents: []}));

        const doc = {
            resource: {
                id: '1',
                type: 'T3',
                dating: 'abc',
                period: 'abc',
                periodEnd: 'abc',
                relations: {isRecordedIn: ['0']},
            }
        };

        const undefinedFields = Validations.validateDefinedFields(doc.resource, projectConfiguration);
        expect(undefinedFields.length).toBe(0);
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
            Validations.assertNoFieldsMissing(doc, projectConfiguration);
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
            Validations.assertNoFieldsMissing(doc, projectConfiguration);
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
            Validations.assertNoFieldsMissing(doc, projectConfiguration);
            fail();
        } catch (errWithParams) {
            expect(errWithParams).toEqual([ValidationErrors.MISSING_PROPERTY, 'T', 'mandatory']);
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
            Validations.assertCorrectnessOfNumericalValues(doc, projectConfiguration);
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
            Validations.assertCorrectnessOfNumericalValues(doc, projectConfiguration);
            fail();
        } catch (errWithParams) {
            expect(errWithParams).toEqual([ValidationErrors.INVALID_NUMERICAL_VALUES, 'T', 'number1, number2'])
        }
        done();
    });
})