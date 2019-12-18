import {Dating, Dimension, Resource} from 'idai-components-2';
import {CsvFieldTypesConversion} from '../../../../../app/core/import/parser/csv-field-types-conversion';
import {ParserErrors} from '../../../../../app/core/import/parser/parser-errors';
import {IdaiType} from '../../../../../app/core/configuration/model/idai-type';
import CSV_NOT_A_BOOLEAN = ParserErrors.CSV_NOT_A_BOOLEAN;


/**
 * @author Daniel de Oliveira
 * @author Thomas Kleinke
 */
describe('CsvFieldTypesConversion', () => {

    it('field type boolean', () => {

        const type = {
            name: 'TypeName',
            fields: [{
                name: 'Bool1',
                inputType: 'boolean'
            }, {
                name: 'Bool2',
                inputType: 'boolean'
            }],
        } as IdaiType;

        const result = CsvFieldTypesConversion
            .convertFieldTypes(type)({Bool1: 'true', Bool2: 'false', relations: {}} as unknown as Resource);

        expect(result['Bool1']).toBe(true);
        expect(result['Bool2']).toBe(false);
    });


    it('field type dating', () => {

        const type = {
            name: 'TypeName',
            fields: [{
                name: 'dating',
                inputType: 'dating'
            }],
        } as IdaiType;

        const resource = CsvFieldTypesConversion
            .convertFieldTypes(type)({
                dating: [{
                    type: 'range',
                    begin: { inputType: 'bce', inputYear: '0' },
                    end: { inputType: 'bce', inputYear: '1' },
                    margin: '1',
                    source: 'abc',
                    isImprecise: 'true',
                    isUncertain: 'false'
                }],
                relations: {}
            } as unknown as Resource);


        const dating: Dating = resource.dating[0];
        expect(dating.type).toBe('range');
        expect(dating.begin.inputType).toBe('bce');
        expect(dating.begin.inputYear).toBe(0);
        expect(dating.end.inputType).toBe('bce');
        expect(dating.end.inputYear).toBe(1);
        expect(dating.margin).toBe(1);
        expect(dating.source).toBe('abc');
        expect(dating.isImprecise).toBe(true);
        expect(dating.isUncertain).toBe(false);
    });


    it('dating.isUncertain is not a boolean', () => {

        const type = {
            name: 'TypeName',
            fields: [{
                name: 'dating',
                inputType: 'dating'
            }],
        } as IdaiType;

        try {
            CsvFieldTypesConversion
                .convertFieldTypes(type)({ dating: [{ isUncertain: 'false123' }], relations: {}} as unknown as Resource);
            fail();
        } catch (msgWithParams) {
            expect(msgWithParams).toEqual([CSV_NOT_A_BOOLEAN, 'false123', 'dating.0.isUncertain'])
        }
    });


    it('field type dimension', () => {

        const type = {
            name: 'TypeName',
            fields: [{
                name: 'dimension',
                inputType: 'dimension'
            }],
        } as IdaiType;

        const resource = CsvFieldTypesConversion
            .convertFieldTypes(type)({
                dimension: [{
                    value: '1',
                    rangeMin: '2',
                    rangeMax: '3',
                    inputValue: '4',
                    inputRangeEndValue: '5',
                    measurementPosition: 'a',
                    measurementComment: 'b',
                    inputUnit: 'mm',
                    isImprecise: 'true',
                    isRange: 'false'
                }],
                relations: {}
            } as unknown as Resource);

        const dimension: Dimension = resource['dimension'][0];
        expect(dimension.value).toBe(1);
        expect(dimension.rangeMin).toBe(2);
        expect(dimension.rangeMax).toBe(3);
        expect(dimension.inputValue).toBe(4);
        expect(dimension.inputRangeEndValue).toBe(5);
        expect(dimension.measurementPosition).toBe('a');
        expect(dimension.measurementComment).toBe('b');
        expect(dimension.inputUnit).toBe('mm');
        expect(dimension.isImprecise).toBe(true);
        expect(dimension.isRange).toBe(false);
    });


    it('field type radio', () => {

        const type = {
            name: 'TypeName',
            fields: [{
                name: 'r',
                inputType: 'radio'
            }],
        } as IdaiType;

        const resource = CsvFieldTypesConversion
            .convertFieldTypes(type)({
                r: 'rr',
                relations: {}
            } as unknown as Resource);

        expect(resource['r']).toBe('rr');
    });


    it('field type date', () => {

        const type = {
            name: 'TypeName',
            fields: [{
                name: 'd',
                inputType: 'date'
            }],
        } as IdaiType;

        const resource = CsvFieldTypesConversion
            .convertFieldTypes(type)({
                d: '10.07.2019',
                relations: {}
            } as unknown as Resource);

        expect(resource['d']).toBe('10.07.2019');
    });


    it('field type dropdown range', () => {

        const type = {
            name: 'TypeName',
            fields: [{
                name: 'dd1',
                inputType: 'dropdownRange'
            },
            {
                name: 'dd2',
                inputType: 'dropdownRange'
            }],
        } as IdaiType;

        const resource = CsvFieldTypesConversion
            .convertFieldTypes(type)({
                dd1: 'a',
                dd2: 'b',
                dd2End: 'c', // currently, the code handles this as a regular field, so this is not a special case. we test is here for completeness
                relations: {}
            } as unknown as Resource);

        expect(resource['dd1']).toBe('a');
        expect(resource['dd2']).toBe('b');
        expect(resource['dd2End']).toBe('c');
    });


    it('field type checkboxes', () => {

        const type = {
            name: 'TypeName',
            fields: [{
                name: 'CB',
                inputType: 'checkboxes'
            }],
        } as IdaiType;

        const resource = CsvFieldTypesConversion
            .convertFieldTypes(type)({
                CB: 'a;b;c',
                relations: {}
            } as unknown as Resource);

        const cb = resource['CB'];
        expect(cb).toEqual(['a', 'b', 'c']);
    });


    it('field type unsignedInt', () => {

        const type = {
            name: 'TypeName',
            fields: [{
                name: 'ui',
                inputType: 'unsignedInt'
            }],
        } as IdaiType;

        const resource = CsvFieldTypesConversion
            .convertFieldTypes(type)({
                ui: '100',
                relations: {}
            } as unknown as Resource);

        expect(resource['ui']).toBe(100);
    });


    it('field type float', () => {

        const type = {
            name: 'TypeName',
            fields: [{
                name: 'uf1',
                inputType: 'float'
            }, {
                name: 'uf2',
                inputType: 'float'
            },
            {
                name: 'uf3',
                inputType: 'float'
            }]
        } as IdaiType;

        const resource = CsvFieldTypesConversion
            .convertFieldTypes(type)({
                uf1: '100.1',
                uf2: '100,2',
                uf3: '-100,3',
                relations: {}
            } as unknown as Resource);

        expect(resource['uf1']).toBe(100.1);
        expect(resource['uf2']).toBe(100.2);
        expect(resource['uf3']).toBe(-100.3);
    });


    it('field type unsignedFloat', () => {

        const type = {
            name: 'TypeName',
            fields: [{
                name: 'uf1',
                inputType: 'unsignedFloat'
            }, {
                name: 'uf2',
                inputType: 'unsignedFloat'
            }]
        } as IdaiType;

        const resource = CsvFieldTypesConversion
            .convertFieldTypes(type)({
                uf1: '100.1',
                uf2: '100,2',
                relations: {}
            } as unknown as Resource);

        expect(resource['uf1']).toBe(100.1);
        expect(resource['uf2']).toBe(100.2);
    });


    it('relations', () => {

        const type = {
            name: 'TypeName',
            fields: [{
                name: 'uf',
                inputType: 'unsignedFloat'
            }],
        } as IdaiType;

        const resource = CsvFieldTypesConversion
            .convertFieldTypes(type)({
                relations: {
                    isAbove: 'a;b',
                    isBelow: 'd'
                }
            } as unknown as Resource);

        expect(resource.relations['isAbove']).toEqual(['a', 'b']);
        expect(resource.relations['isBelow']).toEqual(['d']);
    });


    // err cases


    it('field type unsignedInt - not a number', () => {

        const type = {
            name: 'TypeName',
            fields: [{
                name: 'ui',
                inputType: 'unsignedInt'
            }],
        } as IdaiType;

        expectNotANumberError(type, 'ui', 'abc');
    });


    it('field type unsignedFloat - not a number', () => {

        const type = {
            name: 'TypeName',
            fields: [{
                name: 'uf',
                inputType: 'unsignedFloat'
            }],
        } as IdaiType;

        expectNotANumberError(type, 'uf', 'a100.0');
    });


    async function expectNotANumberError(type: IdaiType, fieldName: string, value: string) {

        try {

            const resource: Resource = {} as unknown as Resource;
            (resource as any)[fieldName] = value;
            CsvFieldTypesConversion.convertFieldTypes(type)(resource);

            fail();
        } catch (msgWithParams) {

            expect(msgWithParams).toEqual([ParserErrors.CSV_NOT_A_NUMBER, value, fieldName]);

        }
    }
});