import { Field, ProjectConfiguration, Forest } from 'idai-field-core';
import { ValidationErrors } from '../../../../src/app/model/validation-errors';
import { Validations } from '../../../../src/app/model/validations';
import InputType = Field.InputType;


/**
 * @author Daniel de Oliveira
 * @author Thomas Kleinke
 * @author Sebastian Cuy
 */
describe('Validations', () => {

    const projectConfiguration = new ProjectConfiguration({
        forms: Forest.build(
            [[{
                name: 'T',
                groups: [{
                    name: 'stem', fields: [
                        { name: 'id' },
                        { name: 'identifier' },
                        { name: 'category' },
                        { name: 'optional' },
                        { name: 'mandatory', mandatory: true },
                        { name: 'number1', label: 'number1', inputType: 'float' },
                        { name: 'number2', label: 'number2', inputType: 'float' },
                        { name: 'number3', label: 'number3', inputType: 'float' },
                        { name: 'url1', label: 'url1', inputType: 'url' },
                        { name: 'url2', label: 'url2', inputType: 'url' },
                        { name: 'url3', label: 'url3', inputType: 'url' },
                        { name: 'dating1', label: 'dating1', inputType: 'dating' },
                        { name: 'dating2', label: 'dating2', inputType: 'dating' },
                        { name: 'dating3', label: 'dating3', inputType: 'dating' },
                        { name: 'dating4', label: 'dating4', inputType: 'dating' },
                        { name: 'dating5', label: 'dating5', inputType: 'dating' },
                        { name: 'dating6', label: 'dating6', inputType: 'dating' },
                        { name: 'dating7', label: 'dating7', inputType: 'dating' },
                        { name: 'dating8', label: 'dating8', inputType: 'dating' },
                        { name: 'dating9', label: 'dating9', inputType: 'dating' },
                        { name: 'dimension1', label: 'dimension1', inputType: 'dimension' },
                        { name: 'dimension2', label: 'dimension2', inputType: 'dimension' },
                        { name: 'dimension3', label: 'dimension3', inputType: 'dimension' },
                        { name: 'dimension4', label: 'dimension4', inputType: 'dimension' },
                        { name: 'dimension5', label: 'dimension5', inputType: 'dimension' },
                        { name: 'dimension6', label: 'dimension6', inputType: 'dimension' },
                        { name: 'dimension7', label: 'dimension7', inputType: 'dimension' },
                        { name: 'dimension8', label: 'dimension8', inputType: 'dimension' },
                        { name: 'dimension9', label: 'dimension9', inputType: 'dimension' },
                        { name: 'dimension10', label: 'dimension10', inputType: 'dimension'},
                        { name: 'dimension11', label: 'dimension11', inputType: 'dimension', inputTypeOptions: { validation: { permissive: true }} },
                        { name: 'dimension12', label: 'dimension12', inputType: 'dimension' },
                        { name: 'literature1', label: 'literature1', inputType: 'literature' },
                        { name: 'literature2', label: 'literature2', inputType: 'literature' },
                        { name: 'literature3', label: 'literature3', inputType: 'literature' },
                        { name: 'literature4', label: 'literature4', inputType: 'literature' },
                        { name: 'literature5', label: 'literature5', inputType: 'literature' },
                        { name: 'period1', label: 'period1', inputType: InputType.DROPDOWNRANGE },
                        { name: 'period2', label: 'period2', inputType: InputType.DROPDOWNRANGE },
                        { name: 'period3', label: 'period3', inputType: InputType.DROPDOWNRANGE },
                        { name: 'period4', label: 'period4', inputType: InputType.DROPDOWNRANGE },
                        {
                            name: 'composite1', label: 'composite1', inputType: 'composite',
                            subfields: [
                                { name: 'subfield1', inputType: 'boolean' }, { name: 'subfield2', inputType: 'int' }
                            ]
                        },
                        {
                            name: 'composite2', label: 'composite2', inputType: 'composite',
                            subfields: [
                                { name: 'subfield1', inputType: 'boolean' },
                                { name: 'subfield2', inputType: 'int' }
                            ]
                        },
                        {
                            name: 'composite3', label: 'composite2', inputType: 'composite',
                            subfields: [
                                { name: 'subfield1', inputType: 'boolean' },
                                { name: 'subfield2', inputType: 'int' }
                            ]
                        },
                        {
                            name: 'composite4', label: 'composite2', inputType: 'composite',
                            subfields: [
                                { name: 'subfield1', inputType: 'boolean' },
                                { name: 'subfield2', inputType: 'int' }
                            ]
                        },
                        {
                            name: 'composite5', label: 'composite2', inputType: 'composite',
                            subfields: [
                                { name: 'subfield1', inputType: 'boolean' },
                                {
                                    name: 'subfield2', inputType: 'int',
                                    condition: { subfieldName: 'subfield1', values: true }
                                }
                            ]
                        },
                        { name: 'beginningDate', label: 'beginningDate', inputType: 'date' },
                        { name: 'endDate', label: 'endDate', inputType: 'date' },
                        { name: 'shortInput', label: 'shortInput', inputType: 'input', maxCharacters: 10 },
                        { name: 'isBelow', label: 'isBelow', inputType: 'relation' }
                    ]

            }]}, []],
            [{
                name: 'T2',
                groups: [{ name: 'stem', fields: [
                    { name: 'id' },
                    { name: 'category' }
                ]}]
            }, []],
            [{
                    name: 'T3',
                    groups: [{ name: 'stem', fields: [
                        { name: 'id' },
                        { name: 'category' },
                        { name: 'dating' },
                        { name: 'period', inputType: 'dropdownRange' }
                    ]}]
                }, []]
            ] as any),
        categories: {},
        relations: [
            {
                name: 'isRelatedTo',
                domain: ['T'],
                range: ['T'],
                inverse: 'NO-INVERSE',
                editable: false,
                visible: false,
                inputType: 'relation'
            },
            {
                name: 'isDepictedIn',
                domain: ['T'],
                range: ['T2'],
                inverse: 'NO-INVERSE',
                editable: false,
                visible: false,
                inputType: 'relation'
            },
            {
                name: 'isRecordedIn',
                domain: ['T'],
                range: ['T2'],
                inverse: 'NO-INVERSE',
                editable: false,
                visible: false,
                inputType: 'relation'
            }
        ],
        commonFields: {},
        valuelists: {},
        projectLanguages: []
    });


    it('validate defined fields', () => {

        const datastore = jasmine.createSpyObj('datastore', ['find']);
        datastore.find.and.returnValues(Promise.resolve({ totalCount: 0, documents: [] }));

        const doc = {
            resource: {
                id: '1',
                category: 'T',
                mandatory: 'm',
                undef: 'abc',
                relations: { isRecordedIn: ['0'] },
            }
        };

        const undefinedFields = Validations.validateDefinedFields(doc.resource as any, projectConfiguration);
        expect(undefinedFields).toContain('undef');
    });


    it('validate defined fields - exclude period, periodEnd if dating defined for category', () => {

        const datastore = jasmine.createSpyObj('datastore', ['find']);
        datastore.find.and.returnValues(Promise.resolve({ totalCount: 0, documents: [] }));

        const doc = {
            resource: {
                id: '1',
                category: 'T3',
                dating: 'abc',
                period: { value: 'abc', endValue: 'de' },
                relations: { isRecordedIn: ['0'] },
            }
        };

        const undefinedFields = Validations.validateDefinedFields(doc.resource as any, projectConfiguration);
        expect(undefinedFields.length).toBe(0);
    });


    it('validate defined fields - do not allow non-relation fields with the same name as relation fields', () => {

        const datastore = jasmine.createSpyObj('datastore', ['find']);
        datastore.find.and.returnValues(Promise.resolve({ totalCount: 0, documents: [] }));

        const doc = {
            resource: {
                id: '1',
                category: 'T',
                mandatory: 'm',
                isBelow: 'test',
                relations: { isBelow: ['0'] },
            }
        };

        const undefinedFields = Validations.validateDefinedFields(doc.resource as any, projectConfiguration);
        expect(undefinedFields).toContain('isBelow');
    });


    it('should report nothing when omitting optional property', () => {

        const datastore = jasmine.createSpyObj('datastore',['find']);
        datastore.find.and.returnValues(Promise.resolve({ totalCount: 0, documents: [] }));

        const doc = {
            resource: {
                id: '1',
                category: 'T',
                mandatory: 'm',
                relations: { isRecordedIn: ['0'] },
            }
        };


        try {
            Validations.assertNoFieldsMissing(doc as any, projectConfiguration);
        } catch (errWithParams) {
            fail(errWithParams);
        }
    });


    it('should report error when omitting mandatory property', () => {

        const doc = {
            resource: {
                id: '1',
                category: 'T',
                relations: {},
            }
        };

        try {
            Validations.assertNoFieldsMissing(doc as any, projectConfiguration);
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
            Validations.assertNoFieldsMissing(doc as any, projectConfiguration);
            fail();
        } catch (errWithParams) {
            expect(errWithParams).toEqual([ValidationErrors.MISSING_PROPERTY, 'T', 'mandatory']);
        }
    });


    it('should report invalid numeric field', () => {

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
            Validations.assertCorrectnessOfNumericalValues(doc as any, projectConfiguration);
            fail();
        } catch (errWithParams) {
            expect(errWithParams).toEqual([ValidationErrors.INVALID_NUMERICAL_VALUES, 'T', 'number1']);
        }
    });


    it('should report invalid numeric fields', () => {

        const doc = {
            resource: {
                id: '1',
                category: 'T',
                mandatory: 'm',
                number1: 'ABC',
                number2: 'DEF',
                relations: { isRecordedIn: ['0'] }
            }
        };

        try {
            Validations.assertCorrectnessOfNumericalValues(doc as any, projectConfiguration);
            fail();
        } catch (errWithParams) {
            expect(errWithParams).toEqual([ValidationErrors.INVALID_NUMERICAL_VALUES, 'T', 'number1, number2']);
        }
    });


    it('should report only newly entered invalid numeric fields', () => {

        const previousVersion: any = {
            resource: {
                id: '1',
                category: 'T',
                mandatory: 'm',
                number1: 'ABC',
                number2: 'DEF',
                number3: 123,
                relations: { isRecordedIn: ['0'] }
            }
        };

        const currentVersion: any = {
            resource: {
                id: '1',
                category: 'T',
                mandatory: 'm',
                number1: 'ABC',
                number2: 'GHI',
                number3: 'JKL',
                relations: { isRecordedIn: ['0'] }
            }
        };

        try {
            Validations.assertCorrectnessOfNumericalValues(currentVersion, projectConfiguration, true,
                previousVersion);
            fail();
        } catch (errWithParams) {
            expect(errWithParams).toEqual([ValidationErrors.INVALID_NUMERICAL_VALUES, 'T', 'number2, number3']);
        }
    });


    it('should report invalid URL field', () => {

        const doc = {
            resource: {
                id: '1',
                category: 'T',
                mandatory: 'm',
                url1: 'ABC',
                relations: { isRecordedIn: ['0'] }
            }
        };

        try {
            Validations.assertCorrectnessOfUrls(doc as any, projectConfiguration);
            fail();
        } catch (errWithParams) {
            expect(errWithParams).toEqual([ValidationErrors.INVALID_URLS, 'T', 'url1']);
        }
    });


    it('should report invalid URL fields', () => {

        const doc = {
            resource: {
                id: '1',
                category: 'T',
                mandatory: 'm',
                url1: 'ABC',
                url2: 'DEF',
                relations: { isRecordedIn: ['0'] }
            }
        };

        try {
            Validations.assertCorrectnessOfUrls(doc as any, projectConfiguration);
            fail();
        } catch (errWithParams) {
            expect(errWithParams).toEqual([ValidationErrors.INVALID_URLS, 'T', 'url1, url2']);
        }
    });


    it('should only report newly entered invalid URL fields', () => {

        const previousVersion: any = {
            resource: {
                id: '1',
                category: 'T',
                mandatory: 'm',
                url1: 'ABC',
                url2: 'DEF',
                url3: 'https://example.com/',
                relations: { isRecordedIn: ['0'] }
            }
        };

        const currentVersion: any = {
            resource: {
                id: '1',
                category: 'T',
                mandatory: 'm',
                url1: 'ABC',
                url2: 'GHI',
                url3: 'JKL',
                relations: { isRecordedIn: ['0'] }
            }
        };

        try {
            Validations.assertCorrectnessOfUrls(currentVersion, projectConfiguration, previousVersion);
            fail();
        } catch (errWithParams) {
            expect(errWithParams).toEqual([ValidationErrors.INVALID_URLS, 'T', 'url2, url3']);
        }
    });


    it('should report invalid dating fields', () => {

        const doc = {
            resource: {
                id: '1',
                category: 'T',
                mandatory: 'm',
                // Accept datings with label (deprecated)
                dating1: [{ label: 'Dating 1' }],
                // Correct dating
                dating2: [{ type: 'range', begin: { inputYear: 30, inputType: 'bce' },
                    end: { inputYear: 20, inputType: 'ce'} }],
                // Invalid range
                dating3: [{ type: 'range', begin: { inputYear: 20, inputType: 'ce' },
                    end: { inputYear: 30, inputType: 'bce'} }],
                // Incomplete range
                dating4: [{ type: 'range', begin: { inputYear: 10, inputType: 'ce'} }],
                // No integer value
                dating5: [{ type: 'single', end: { inputYear: 10.5, inputType: 'ce'} }],
                // Negative value
                dating6: [{ type: 'single', end: { inputYear: -10, inputType: 'ce'} }],
                // No array
                dating7: 'Dating',
                // Invalid field
                dating8: [{ type: 'range', begin: { inputYear: 30, inputType: 'bce' },
                end: { inputYear: 20, inputType: 'ce'}, invalidField: 'asdf' }],
                // Invalid nested field
                dating9: [{ type: 'range', begin: { inputYear: 30, inputType: 'bce' },
                    end: { inputYear: 20, inputType: 'ce', invalidField: 'asdf' } }],
                relations: { isRecordedIn: ['0'] }
            }
        };

        try {
            Validations.assertCorrectnessOfDatingValues(doc as any, projectConfiguration);
            fail();
        } catch (errWithParams) {
            expect(errWithParams).toEqual(
                [
                    ValidationErrors.INVALID_DATING_VALUES,
                    'T',
                    'dating3, dating4, dating5, dating6, dating7, dating8, dating9'
                ]
            );
        }
    });


    it('should only report newly entered invalid dating fields', () => {

        const previousVersion: any = {
            resource: {
                id: '1',
                category: 'T',
                mandatory: 'm',
                dating1: 'ABC',
                dating2: 'DEF',
                dating3: [{ type: 'range', begin: { inputYear: 30, inputType: 'bce' },
                    end: { inputYear: 20, inputType: 'ce'} }],
                relations: { isRecordedIn: ['0'] }
            }
        };

        const currentVersion: any = {
            resource: {
                id: '1',
                category: 'T',
                mandatory: 'm',
                dating1: 'ABC',
                dating2: 'GHI',
                dating3: 'JKL',
                relations: { isRecordedIn: ['0'] }
            }
        };

        try {
            Validations.assertCorrectnessOfDatingValues(currentVersion, projectConfiguration, previousVersion);
            fail();
        } catch (errWithParams) {
            expect(errWithParams).toEqual(
                [
                    ValidationErrors.INVALID_DATING_VALUES,
                    'T',
                    'dating2, dating3'
                ]
            );
        }
    });


    it('should report invalid dimension fields', async done => {

        const doc = {
            resource: {
                id: '1',
                category: 'T',
                mandatory: 'm',
                // Accept dimensions with label (deprecated)
                dimension1: [{ label: 'Dating 1' }],
                // Correct dimension
                dimension2: [{ inputValue: 50.25, inputUnit: 'mm' }],
                // Missing input value
                dimension3: [{ inputUnit: 'mm' }],
                // Missing input unit
                dimension4: [{ inputValue: 15 }],
                // No number value
                dimension5: [{ inputValue: '15', inputUnit: 'mm' }],
                // No number value in range end value
                dimension6: [{ inputValue: 15, inputRangeEndValue: '25', inputUnit: 'mm' }],
                // No array
                dimension7: 'Dimension',
                // Invalid input value
                dimension8: [{ inputValue: 15, inputUnit: 'invalid' }],
                // Invalid field
                dimension9: [{ inputValue: 50.25, inputUnit: 'mm', invalidField: 'asdf' }],
                // Negative values
                dimension10: [{ inputValue: -50.25, inputUnit: 'mm' }],
                // Negative values allowed
                dimension11: [{ inputValue: -50.25, inputUnit: 'mm' }],
                // Identical range values
                dimension12: [{ inputValue: 2, inputRangeEndValue: 2, inputUnit: 'mm' }],
                relations: { isRecordedIn: ['0'] }
            }
        };

        try {
            Validations.assertCorrectnessOfDimensionValues(doc as any, projectConfiguration);
            fail();
        } catch (errWithParams) {
            expect(errWithParams).toEqual(
                [
                    ValidationErrors.INVALID_DIMENSION_VALUES,
                    'T',
                    'dimension3, dimension4, dimension5, dimension6, dimension7, dimension8, dimension9, dimension10, dimension12'
                ]
            );
        }
        done();
    });


    it('should only report newly entered invalid dimension fields', async done => {

        const previousVersion: any = {
            resource: {
                id: '1',
                category: 'T',
                mandatory: 'm',
                dimension1: 'ABC',
                dimension2: 'DEF',
                dimension3: [{ inputValue: 50.25, inputUnit: 'mm' }],
                relations: { isRecordedIn: ['0'] }
            }
        };

        const currentVersion: any = {
            resource: {
                id: '1',
                category: 'T',
                mandatory: 'm',
                dimension1: 'ABC',
                dimension2: 'GHI',
                dimension3: 'JKL',
                relations: { isRecordedIn: ['0'] }
            }
        };

        try {
            Validations.assertCorrectnessOfDimensionValues(currentVersion, projectConfiguration, previousVersion);
            fail();
        } catch (errWithParams) {
            expect(errWithParams).toEqual(
                [
                    ValidationErrors.INVALID_DIMENSION_VALUES,
                    'T',
                    'dimension2, dimension3'
                ]
            );
        }
        done();
    });


    it('should report invalid dropdownRange fields', () => {

        const doc = {
            resource: {
                id: '1',
                category: 'T',
                // Accept dimensions with label (deprecated)
                period1: { value: 'name' },
                period2: { value: '13', endValue: '18' },

                // Wrong
                period3: '3',
                period4: { value: 13, endValue: 14 },

                relations: { isRecordedIn: ['0'] }
            }
        };

        try {
            Validations.assertCorrectnessOfOptionalRangeValues(doc as any, projectConfiguration);
            fail();
        } catch (errWithParams) {
            expect(errWithParams).toEqual(
                [
                    ValidationErrors.INVALID_OPTIONALRANGE_VALUES,
                    'T',
                    'period3, period4'
                ]
            );
        }
    });


    it('should report invalid literature fields', async done => {

        const doc = {
            resource: {
                id: '1',
                category: 'T',
                mandatory: 'm',
                // Correct literature reference
                literature1: [{ quotation: 'Quotation', zenonId: '1234567' }],
                // Correct literature reference, Zenon ID is optional
                literature2: [{ quotation: 'Quotation' }],
                // No quotation
                literature3: [{ zenonId: '1234567' }],
                // No array
                literature4: 'Literature',
                // Invalid field
                literature5: [{ quotation: 'Quotation', zenonId: '1234567', invalidField: 'asdf' }],
                relations: { isRecordedIn: ['0'] }
            }
        };

        try {
            Validations.assertCorrectnessOfLiteratureValues(doc as any, projectConfiguration);
            fail();
        } catch (errWithParams) {
            expect(errWithParams).toEqual(
                [ValidationErrors.INVALID_LITERATURE_VALUES, 'T', 'literature3, literature4, literature5']
            );
        }
        done();
    });


    it('should report invalid composite fields', async done => {

        const doc = {
            resource: {
                id: '1',
                category: 'T',
                mandatory: 'm',
                // Correct composite field value
                composite1: [{ subfield1: true, subfield2: 10 }],
                // No array
                composite2: 'Composite field',
                // Unconfigured subfield
                composite3: [{ subfield1: true, subfield2: 10, subfield3: 'ABC' }],
                // Invalid subfield value
                composite4: [{ subfield1: true, subfield2: 'ABC' }],
                // Unfulfilled subfield condition
                composite5: [{ subfield1: false, subfield2: 10 }],
                relations: { isRecordedIn: ['0'] }
            }
        };

        try {
            Validations.assertCorrectnessOfCompositeValues(doc as any, projectConfiguration);
            fail();
        } catch (errWithParams) {
            expect(errWithParams).toEqual(
                [ValidationErrors.INVALID_COMPOSITE_VALUES, 'T', 'composite2, composite3, composite4, composite5']
            );
        }
        done();
    });


    it('should only report newly entered invalid composite fields', async done => {

        const previousVersion: any = {
            resource: {
                id: '1',
                category: 'T',
                mandatory: 'm',
                composite1: 'ABC',
                composite2: 'DEF',
                composite3: [{ subfield1: true, subfield2: 10 }],
                relations: { isRecordedIn: ['0'] }
            }
        };

        const currentVersion: any = {
            resource: {
                id: '1',
                category: 'T',
                mandatory: 'm',
                composite1: 'ABC',
                composite2: 'GHI',
                composite3: 'JKL',
                relations: { isRecordedIn: ['0'] }
            }
        };

        try {
            Validations.assertCorrectnessOfCompositeValues(currentVersion, projectConfiguration, previousVersion);
            fail();
        } catch (errWithParams) {
            expect(errWithParams).toEqual(
                [ValidationErrors.INVALID_COMPOSITE_VALUES, 'T', 'composite2, composite3']
            );
        }
        done();
    });


    it('should only report newly entered invalid literature fields', async done => {

        const previousVersion: any = {
            resource: {
                id: '1',
                category: 'T',
                mandatory: 'm',
                literature1: 'ABC',
                literature2: 'DEF',
                literature3: [{ quotation: 'Quotation', zenonId: '1234567' }],
                relations: { isRecordedIn: ['0'] }
            }
        };

        const currentVersion: any = {
            resource: {
                id: '1',
                category: 'T',
                mandatory: 'm',
                literature1: 'ABC',
                literature2: 'GHI',
                literature3: 'JKL',
                relations: { isRecordedIn: ['0'] }
            }
        };

        try {
            Validations.assertCorrectnessOfLiteratureValues(currentVersion, projectConfiguration, previousVersion);
            fail();
        } catch (errWithParams) {
            expect(errWithParams).toEqual(
                [ValidationErrors.INVALID_LITERATURE_VALUES, 'T', 'literature2, literature3']
            );
        }
        done();
    });


    it('should report incorrect beginning and end dates', () => {

        const correctDocument1 = {
            resource: {
                id: '1',
                identifier: '',
                category: 'T',
                beginningDate: '01.01.2020',
                endDate: '01.01.2020',
                relations: {}
            }
        };

        const correctDocument2 = {
            resource: {
                id: '1',
                identifier: '',
                category: 'T',
                beginningDate: '01.01.2020',
                endDate: '02.01.2020',
                relations: {}
            }
        };

        const incorrectDocument = {
            resource: {
                id: '1',
                identifier: '',
                category: 'T',
                beginningDate: '01.01.2020',
                endDate: '31.12.2019',
                relations: {}
            }
        };

        try {
            Validations.assertCorrectnessOfBeginningAndEndDates(correctDocument1);
            Validations.assertCorrectnessOfBeginningAndEndDates(correctDocument2);
        } catch (errWithParams) {
            fail();
        }

        try {
            Validations.assertCorrectnessOfBeginningAndEndDates(incorrectDocument);
            fail();
        } catch (errWithParams) {
            expect(errWithParams).toEqual(
                [ValidationErrors.END_DATE_BEFORE_BEGINNING_DATE, 'T']
            );
        }
    });


    it('should report fields with too many characters', async done => {

        const doc = {
            resource: {
                id: '1',
                category: 'T',
                mandatory: 'm',
                shortInput: 'Input text with too many characters',
                relations: { isRecordedIn: ['0'] }
            }
        };

        try {
            Validations.assertMaxCharactersRespected(doc as any, projectConfiguration);
            fail();
        } catch (errWithParams) {
            expect(errWithParams).toEqual(
                [ValidationErrors.MAX_CHARACTERS_EXCEEDED, 'T', 'shortInput', 10]
            );
        }
        done();
    });
});
