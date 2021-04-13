import {ImportValidator} from '../../../../../src/app/core/import/import/process/import-validator';
import {ValidationErrors} from '../../../../../src/app/core/model/validation-errors';
import {ImportErrors} from '../../../../../src/app/core/import/import/import-errors';
import {ProjectConfiguration} from '../../../../../src/app/core/configuration/project-configuration';
import {Tree, FieldDefinition} from 'idai-field-core';


/**
 * @author Daniel de Oliveira
 * @author Thomas Kleinke
 */
describe('ImportValidator', () => {

    const projectConfiguration = new ProjectConfiguration(
        [
          Tree.buildForest([
            [ {
                name: 'T',
                groups: [{ name: 'stem', fields: [
                    { name: 'id' },
                    { name: 'identifier' },
                    { name: 'category' },
                    { name: 'optional' },
                    { name: 'mandatory', mandatory: true },
                    { name: 'number1', label: 'number1', inputType: 'float' },
                    { name: 'number2', label: 'number2', inputType: 'float' },
                    { name: 'ddr', label: 'DropdownRange', inputType: FieldDefinition.InputType.DROPDOWNRANGE },
                    { name: 'ddr2', label: 'DropdownRange2', inputType: FieldDefinition.InputType.DROPDOWNRANGE }
                ]}]
            }, []],
          [ {
                name: 'T2',
                groups: [{ name: 'stem', fields: [
                    { name: 'id' },
                    { name: 'category' }
                ]}]
            }, []],
              [ {
                name: 'T3',
                mustLieWithin: true
            }, []]
        ] as any),
            [
                { name: 'isRelatedTo', label: '', domain: ['T'], range: ['T'], inverse: 'NO-INVERSE' },
                { name: 'isDepictedIn', label: '', domain: ['T'], range: ['T2'], inverse: 'NO-INVERSE' },
                { name: 'isRecordedIn', label: '', domain: ['T'], range: ['T2'], inverse: 'NO-INVERSE' },
                { name: 'includes', label: '', domain: ['T'], range: ['T2'], inverse: 'NO-INVERSE' }, // defined but not allowed
                { name: 'liesWithin', label: '', domain: ['T3'], range: ['T2'], inverse: 'NO-INVERSE' }
            ]
        ]
    );


    it('should report error when omitting mandatory property', () => {

        const doc = {
            resource: {
                id: '1',
                category: 'T',
                relations: {},
            }
        };

        try {
            new ImportValidator(projectConfiguration, undefined).assertIsWellformed(doc as any);
            fail();
        } catch (errWithParams) {
            expect(errWithParams).toEqual([ValidationErrors.MISSING_PROPERTY, 'T', 'mandatory']);
        }
    });


    it('should report error when leaving mandatory property empty', () => {

        const doc = {
            resource: {
                id: '1',
                category: 'T',
                mandatory: '',
                relations: {},
            }
        };

        try {
            new ImportValidator(projectConfiguration, undefined).assertIsWellformed(doc as any);
            fail();
        } catch (errWithParams) {
            expect(errWithParams).toEqual([ValidationErrors.MISSING_PROPERTY, 'T', 'mandatory']);
        }
    });


    it('should report a missing field definition', () => {

        const doc = {
            resource: {
                id: '1',
                category: 'T',
                a: 'b',
                mandatory: 'm',
                relations: {},
            }
        };

        try {
            new ImportValidator(projectConfiguration, undefined).assertFieldsDefined(doc as any);
            fail();
        } catch (errWithParams) {

            expect(errWithParams).toEqual([ImportErrors.INVALID_FIELDS, 'T', 'a']);
        }
    });


    it('should report missing field definitions', () => {

        const doc = {
            resource: {
                id: '1',
                category: 'T',
                a: 'b',
                b: 'a',
                mandatory: 'm',
                relations: {},
            }
        };

        try {
            new ImportValidator(projectConfiguration, undefined).assertFieldsDefined(doc as any);
            fail();
        } catch (errWithParams) {

            expect(errWithParams).toEqual([ImportErrors.INVALID_FIELDS, 'T', 'a, b']);
        }
    });


    it('should report a missing relation field definition', () => {

        const doc = {
            resource: {
                id: '1',
                category: 'T2',
                relations: {
                    isRelatedTo: ['2']
                }
            }
        };

        try {
            new ImportValidator(projectConfiguration, undefined).assertRelationsWellformedness([doc as any]);
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
                category: 'T2',
                relations: {
                    isRelatedTo: ['2'],
                    isDepictedIn: ['3']
                }
            }
        };

        try {
            new ImportValidator(projectConfiguration, undefined).assertRelationsWellformedness([doc as any]);
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
                category: 'T3',
                relations: {
                    isRecordedIn: ['T1'],
                    liesWithin: []
                }
            }
        };

        try {
            await new ImportValidator(
                projectConfiguration,
                {find: (q: any) => Promise.resolve({documents: []})} as any)
                .assertLiesWithinCorrectness([doc.resource as any]);
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
                category: 'T',
                mandatory: 'm',
                number1: 'ABC',
                relations: { isRecordedIn: ['0'] }
            }
        };

        try {
            new ImportValidator(projectConfiguration, undefined).assertIsWellformed(doc as any);
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
                category: 'T',
                mandatory: 'm',
                number1: 'ABC',
                number2: '123',
                relations: { isRecordedIn: ['0'] }
            }
        };

        try {
            new ImportValidator(projectConfiguration, undefined).assertIsWellformed(doc as any);
            fail();
        } catch (errWithParams) {
            expect(errWithParams).toEqual([ValidationErrors.INVALID_NUMERICAL_VALUES, 'T', 'number1, number2'])
        }
        done();
    });
});
