import {ImportValidator} from '../../../../../app/core/import/import/process/import-validator';
import {ValidationErrors} from '../../../../../app/core/model/validation-errors';
import {ImportErrors} from '../../../../../app/core/import/import/import-errors';
import {INPUT_TYPES} from '../../../../../app/c';
import {ProjectConfiguration} from '../../../../../app/core/configuration/project-configuration';


/**
 * @author Daniel de Oliveira
 * @author Thomas Kleinke
 */
describe('ImportValidator', () => {

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
                        {name: 'number2', label: 'number2', inputType: 'float'},
                        {name: 'ddr', label: 'DropdownRange', inputType: INPUT_TYPES.DROPDOWN_RANGE},
                        {name: 'ddr2', label: 'DropdownRange2', inputType: INPUT_TYPES.DROPDOWN_RANGE}
                    ]
                },
                {
                    type: 'T2',
                    fields: [
                        {name: 'id',},
                        {name: 'type',}
                    ]
                },
                {
                    type: 'T3',
                    mustLieWithin: true,
                }
            ],
            relations: [
                {name: 'isRelatedTo', domain: ['T'], range: ['T'], inverse: 'NO-INVERSE'},
                {name: 'isDepictedIn', domain: ['T'], range: ['T2'], inverse: 'NO-INVERSE'},
                {name: 'isRecordedIn', domain: ['T'], range: ['T2'], inverse: 'NO-INVERSE'},
                {name: 'includes', domain: ['T'], range: ['T2'], inverse: 'NO-INVERSE'}, // defined but not allowed
                {name: 'liesWithin', domain: ['T3'], range: ['T2'], inverse: 'NO-INVERSE'}
            ]
        }
    );


    it('should report error when omitting mandatory property', () => {

        const doc = {
            resource: {
                id: '1',
                type: 'T',
                relations: {},
            }
        };

        try {
            new ImportValidator(projectConfiguration, undefined, undefined).assertIsWellformed(doc);
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
            new ImportValidator(projectConfiguration, undefined, undefined).assertIsWellformed(doc);
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
            new ImportValidator(projectConfiguration, undefined, undefined).assertFieldsDefined(doc);
            fail();
        } catch (errWithParams) {

            expect(errWithParams).toEqual([ImportErrors.INVALID_FIELDS, 'T', 'a']);
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
            new ImportValidator(projectConfiguration, undefined, undefined).assertFieldsDefined(doc);
            fail();
        } catch (errWithParams) {

            expect(errWithParams).toEqual([ImportErrors.INVALID_FIELDS, 'T', 'a, b']);
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
            new ImportValidator(projectConfiguration, undefined, undefined).assertRelationsWellformedness([doc]);
            fail();
        } catch (errWithParams) {

            expect(errWithParams).toEqual([ImportErrors.INVALID_RELATIONS, 'T2',
                'isRelatedTo']);
        }
    });


    it('missing relation field definitions', () => {

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
            new ImportValidator(projectConfiguration, undefined, undefined).assertRelationsWellformedness([doc]);
            fail();
        } catch (errWithParams) {

            expect(errWithParams).toEqual([ImportErrors.INVALID_RELATIONS, 'T2',
                'isRelatedTo, isDepictedIn']);
        }
    });


    it('assertLiesWithinCorrectness - must lie within', async done => {

        const doc = {
            resource: {
                id: '3',
                identifier: '3',
                type: 'T3',
                relations: {
                    isRecordedIn: ['T1'],
                    liesWithin: []
                }
            }
        };

        try {
            await new ImportValidator(
                projectConfiguration,
                {find: (q: any) => Promise.resolve({documents: []})} as any,
                undefined).assertLiesWithinCorrectness([doc.resource as any]);
            fail();
        } catch (errWithParams) {

            expect(errWithParams).toEqual([ImportErrors.MUST_LIE_WITHIN_OTHER_NON_OPERATON_RESOURCE, 'T3', '3']);
        }
        done();
    });


    it('invalid numeric field', async done => {

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
            new ImportValidator(projectConfiguration, undefined, undefined).assertIsWellformed(doc);
            fail();
        } catch (errWithParams) {
            expect(errWithParams).toEqual([ValidationErrors.INVALID_NUMERICAL_VALUES, 'T', 'number1'])
        }
        done();
    });


    it('invalid numeric fields', async done => {

        const doc = {
            resource: {
                id: '1',
                type: 'T',
                mandatory: 'm',
                number1: 'ABC',
                number2: '123',
                relations: {isRecordedIn: ['0']}
            }
        };

        try {
            new ImportValidator(projectConfiguration, undefined, undefined).assertIsWellformed(doc);
            fail();
        } catch (errWithParams) {
            expect(errWithParams).toEqual([ValidationErrors.INVALID_NUMERICAL_VALUES, 'T', 'number1, number2'])
        }
        done();
    });


    it('valid dropdown range fields', async done => {

        const doc = {
            resource: {
                id: '1',
                type: 'T',
                mandatory: 'm',
                ddr: 'value',
                ddrEnd: 'endValue',
                ddr2: 'value',
                relations: {isRecordedIn: ['0']}
            }
        };

        try {
            new ImportValidator(projectConfiguration, undefined, undefined).assertDropdownRangeComplete(doc.resource);
        } catch (errWithParams) {
            fail(errWithParams);
        }
        done();
    });

    it('invalid dropdown range field', async done => {

        const doc = {
            resource: {
                id: '1',
                type: 'T',
                mandatory: 'm',
                ddr: '',
                ddrEnd: 'endValue',
                relations: {isRecordedIn: ['0']}
            }
        };

        try {
            new ImportValidator(projectConfiguration, undefined, undefined).assertDropdownRangeComplete(doc.resource);
            fail();
        } catch (errWithParams) {
            expect(errWithParams).toEqual([ImportErrors.INVALID_DROPDOWN_RANGE_VALUES, 'ddr'])
        }
        done();
    });


    it('invalid dropdown range field - key missing altogether', async done => {

        const doc = {
            resource: {
                id: '1',
                type: 'T',
                mandatory: 'm',
                ddrEnd: 'endValue',
                relations: {isRecordedIn: ['0']}
            }
        };

        try {
            new ImportValidator(projectConfiguration, undefined, undefined).assertDropdownRangeComplete(doc.resource);
            fail();
        } catch (errWithParams) {
            expect(errWithParams).toEqual([ImportErrors.INVALID_DROPDOWN_RANGE_VALUES, 'ddr'])
        }
        done();
    });
});