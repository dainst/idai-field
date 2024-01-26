import { Dating, Dimension, Resource, CategoryForm } from 'idai-field-core';
import { ParserErrors } from '../../../../../src/app/components/import/parser/parser-errors';
import CSV_NOT_A_BOOLEAN = ParserErrors.CSV_NOT_A_BOOLEAN;
import { convertFieldTypes } from '../../../../../src/app/components/import/parser/convert-field-types';


/**
 * @author Daniel de Oliveira
 * @author Thomas Kleinke
 */
describe('convertFieldTypes', () => {

    it('field type boolean', () => {

        const category = {
            name: 'Category',
            groups: [{ fields: [{
                name: 'Bool1',
                inputType: 'boolean'
            }, {
                name: 'Bool2',
                inputType: 'boolean'
            }]}],
        } as CategoryForm;

        const result = convertFieldTypes(category)({Bool1: 'true', Bool2: 'false', relations: {}} as unknown as Resource);

        expect(result['Bool1']).toBe(true);
        expect(result['Bool2']).toBe(false);
    });


    it('field type dating', () => {

        const category = {
            name: 'Category',
            groups: [{ fields: [{
                name: 'dating',
                inputType: 'dating'
            }]}],
        } as CategoryForm;

        const resource = convertFieldTypes(category)({
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


    it('field type dating - leave nulls unconverted', () => {

        const category = {
            name: 'Category',
            groups: [{ fields: [{
                name: 'dating',
                inputType: 'dating'
            }]}],
        } as CategoryForm;

        const resource = convertFieldTypes(category)({
                dating: [null],
                relations: {}
            } as unknown as Resource);

        expect(resource['dating']).toEqual([null]);
    });


    it('dating.isUncertain is not a boolean', () => {

        const category = {
            name: 'Category',
            groups: [{ fields: [{
                name: 'dating',
                inputType: 'dating'
            }]}],
        } as CategoryForm;

        try {
            convertFieldTypes(category)({ dating: [{ isUncertain: 'false123' }], relations: {}} as unknown as Resource);
            fail();
        } catch (msgWithParams) {
            expect(msgWithParams).toEqual([CSV_NOT_A_BOOLEAN, 'false123', 'dating.0.isUncertain'])
        }
    });


    it('field type dimension', () => {

        const category = {
            name: 'Category',
            groups: [{ fields: [{
                name: 'dimension',
                inputType: 'dimension'
            }]}],
        } as CategoryForm;

        const resource = convertFieldTypes(category)({
                dimension: [{
                    value: '1',
                    rangeMin: '2',
                    rangeMax: '3',
                    inputValue: '4',
                    inputRangeEndValue: '5',
                    measurementPosition: 'a',
                    measurementComment: 'b',
                    inputUnit: 'mm',
                    isImprecise: 'true'
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
    });


    it('field type dimension - leave nulls unconverted', () => {

        const category = {
            name: 'Category',
            groups: [{ fields: [{
                name: 'dimension',
                inputType: 'dimension'
            }]}],
        } as CategoryForm;

        const resource = convertFieldTypes(category)({
            dimension: [null],
            relations: {}
        } as unknown as Resource);

        expect(resource['dimension']).toEqual([null]);
    });


    it('field type composite', () => {

        const category = {
            name: 'Category',
            groups: [{ fields: [{
                name: 'composite',
                inputType: 'composite',
                subfields: [
                    { name: 'subfield1', inputType: 'boolean' },
                    { name: 'subfield2', inputType: 'unsignedInt' },
                    { name: 'subfield3', inputType: 'checkboxes' },
                    { name: 'subfield4', inputType: 'input' }
                ]
            }]}],
        } as CategoryForm;

        const resource = convertFieldTypes(category)({
            composite: [{
                    subfield1: 'true',
                    subfield2: '7',
                    subfield3: 'value1;value2',
                    subfield4: 'text',
                }],
                relations: {}
            } as unknown as Resource);

        const composite: any = resource.composite[0];
        expect(composite.subfield1).toBe(true);
        expect(composite.subfield2).toBe(7);
        expect(composite.subfield3).toEqual(['value1', 'value2']);
        expect(composite.subfield4).toBe('text');
    });


    it('field type composite - leave nulls unconverted', () => {

        const category = {
            name: 'Category',
            groups: [{ fields: [{
                name: 'composite',
                inputType: 'composite',
                subfields: [
                    { name: 'subfield1', inputType: 'boolean' },
                    { name: 'subfield2', inputType: 'unsignedInt' }
                ]
            }]}],
        } as CategoryForm;

        const resource = convertFieldTypes(category)({
            composite: [null],
            relations: {}
        } as unknown as Resource);

        expect(resource['composite']).toEqual([null]);
    });


    it('field type radio', () => {

        const category = {
            name: 'Category',
            groups: [{ fields: [{
                name: 'r',
                inputType: 'radio'
            }]}],
        } as CategoryForm;

        const resource = convertFieldTypes(category)({
                r: 'rr',
                relations: {}
            } as unknown as Resource);

        expect(resource['r']).toBe('rr');
    });


    it('field type date', () => {

        const category = {
            name: 'Category',
            groups: [{ fields: [{
                name: 'd',
                inputType: 'date'
            }]}],
        } as CategoryForm;

        const resource = convertFieldTypes(category)({
                d: '10.07.2019',
                relations: {}
            } as unknown as Resource);

        expect(resource['d']).toBe('10.07.2019');
    });


    it('field type dropdown range', () => {

        const category = {
            name: 'Category',
            groups: [{ fields: [{
                name: 'dd1',
                inputType: 'dropdownRange'
            },
            {
                name: 'dd2',
                inputType: 'dropdownRange'
            }]}],
        } as CategoryForm;

        const resource = convertFieldTypes(category)({
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

        const category = {
            name: 'Category',
            groups: [{ fields: [{
                name: 'CB',
                inputType: 'checkboxes'
            }]}],
        } as CategoryForm;

        const resource = convertFieldTypes(category)({
                CB: 'a;b;c',
                relations: {}
            } as unknown as Resource);

        const cb = resource['CB'];
        expect(cb).toEqual(['a', 'b', 'c']);
    });


    it('field type int', () => {

        const category = {
            name: 'Category',
            groups: [{ fields: [{
                name: 'i',
                inputType: 'int'
            }]}],
        } as CategoryForm;

        const resource = convertFieldTypes(category)({
                i: '-100',
                relations: {}
            } as unknown as Resource);

        expect(resource['i']).toBe(-100);
    });


    it('field type unsignedInt', () => {

        const category = {
            name: 'Category',
            groups: [{ fields: [{
                name: 'ui',
                inputType: 'unsignedInt'
            }]}],
        } as CategoryForm;

        const resource = convertFieldTypes(category)({
                ui: '100',
                relations: {}
            } as unknown as Resource);

        expect(resource['ui']).toBe(100);
    });


    it('field type float', () => {

        const category = {
            name: 'Category',
            groups: [{ fields: [{
                name: 'f1',
                inputType: 'float'
            }, {
                name: 'f2',
                inputType: 'float'
            },
            {
                name: 'f3',
                inputType: 'float'
            }]}]
        } as CategoryForm;

        const resource = convertFieldTypes(category)({
                f1: '100.1',
                f2: '100,2',
                f3: '-100,3',
                relations: {}
            } as unknown as Resource);

        expect(resource['f1']).toBe(100.1);
        expect(resource['f2']).toBe(100.2);
        expect(resource['f3']).toBe(-100.3);
    });


    it('field type unsignedFloat', () => {

        const category = {
            name: 'Category',
            groups: [{ fields: [{
                name: 'uf1',
                inputType: 'unsignedFloat'
            }, {
                name: 'uf2',
                inputType: 'unsignedFloat'
            }]}]
        } as CategoryForm;

        const resource = convertFieldTypes(category)({
                uf1: '100.1',
                uf2: '100,2',
                relations: {}
            } as unknown as Resource);

        expect(resource['uf1']).toBe(100.1);
        expect(resource['uf2']).toBe(100.2);
    });


    it('relations', () => {

        const category = {
            name: 'Category',
            groups: [{ fields: [{
                name: 'uf',
                inputType: 'unsignedFloat'
            }]}],
        } as CategoryForm;

        const resource = convertFieldTypes(category)({
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

        const category = {
            name: 'Category',
            groups: [{ fields: [{
                name: 'ui',
                inputType: 'unsignedInt'
            }]}],
        } as CategoryForm;

        expectNotANumberError(category, 'ui', 'abc');
    });


    it('field type unsignedFloat - not a number', () => {

        const category = {
            name: 'Category',
            groups: [{ fields: [{
                name: 'uf',
                inputType: 'unsignedFloat'
            }]}],
        } as CategoryForm;

        expectNotANumberError(category, 'uf', 'a100.0');
    });


    async function expectNotANumberError(category: CategoryForm, fieldName: string, value: string) {

        try {
            const resource: Resource = {} as unknown as Resource;
            (resource as any)[fieldName] = value;
            convertFieldTypes(category)(resource);

            fail();
        } catch (msgWithParams) {
            expect(msgWithParams).toEqual([ParserErrors.CSV_NOT_A_NUMBER, value, fieldName]);
        }
    }
});
