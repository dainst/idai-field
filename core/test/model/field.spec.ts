import { Field } from '../../src/model/configuration/field';


/**
 * @author Thomas Kleinke
 */
 describe('Field', () => {

    it('validate correct field data', () => {

        expect(Field.InputType.isValidFieldData('text', Field.InputType.INPUT)).toBe(true);
        expect(Field.InputType.isValidFieldData({ de: 'text1', en: 'text2' }, Field.InputType.INPUT)).toBe(true);
        expect(Field.InputType.isValidFieldData('text', Field.InputType.SIMPLE_INPUT)).toBe(true);
        expect(Field.InputType.isValidFieldData('text', Field.InputType.TEXT)).toBe(true);
        expect(Field.InputType.isValidFieldData({ de: 'text1', en: 'text2' }, Field.InputType.TEXT)).toBe(true);
        expect(Field.InputType.isValidFieldData('text', Field.InputType.DROPDOWN)).toBe(true);
        expect(Field.InputType.isValidFieldData('text', Field.InputType.RADIO)).toBe(true);
        expect(Field.InputType.isValidFieldData('text', Field.InputType.CATEGORY)).toBe(true);
        expect(Field.InputType.isValidFieldData(['a', 'b'], Field.InputType.MULTIINPUT)).toBe(true);
        expect(Field.InputType.isValidFieldData(['a', 'b'], Field.InputType.CHECKBOXES)).toBe(true);
        expect(Field.InputType.isValidFieldData(700, Field.InputType.UNSIGNEDINT)).toBe(true);
        expect(Field.InputType.isValidFieldData(7.5, Field.InputType.UNSIGNEDFLOAT)).toBe(true);
        expect(Field.InputType.isValidFieldData(-7.5, Field.InputType.FLOAT)).toBe(true);
        expect(Field.InputType.isValidFieldData(true, Field.InputType.BOOLEAN)).toBe(true);
        expect(Field.InputType.isValidFieldData(false, Field.InputType.BOOLEAN)).toBe(true);
        expect(Field.InputType.isValidFieldData('31.01.2010', Field.InputType.DATE)).toBe(true);
        expect(Field.InputType.isValidFieldData('01.2010', Field.InputType.DATE)).toBe(true);
        expect(Field.InputType.isValidFieldData('2010', Field.InputType.DATE)).toBe(true);

        expect(Field.InputType.isValidFieldData(
            { value: 'A', endValue: 'B' },
            Field.InputType.DROPDOWNRANGE
        )).toBe(true);

        expect(Field.InputType.isValidFieldData(
            [{ type: 'exact', begin: { year: 200, inputYear: 200, inputType: 'ce' } }],
            Field.InputType.DATING
        )).toBe(true);

        expect(Field.InputType.isValidFieldData(
            [{ inputValue: 50, inputUnit: 'cm' }],
            Field.InputType.DIMENSION
        )).toBe(true);

        expect(Field.InputType.isValidFieldData(
            [{ quotation: 'text' }],
            Field.InputType.LITERATURE
        )).toBe(true);

        expect(Field.InputType.isValidFieldData(
            { type: 'Point', coordinates: [0.5, 1.5] },
            Field.InputType.GEOMETRY
        )).toBe(true);

        expect(Field.InputType.isValidFieldData(
            { liesWithin: ['a', 'b'] },
            Field.InputType.RELATION
        )).toBe(true);

        expect(Field.InputType.isValidFieldData(
            { isInstanceOf: ['a', 'b'] },
            Field.InputType.INSTANCE_OF
        )).toBe(true);
    });


    it('validate incorrect field data', () => {

        expect(Field.InputType.isValidFieldData(700, Field.InputType.INPUT)).toBe(false);
        expect(Field.InputType.isValidFieldData({ de: 'text1', en: 'text2' }, Field.InputType.SIMPLE_INPUT)).toBe(false);
        expect(Field.InputType.isValidFieldData(700, Field.InputType.TEXT)).toBe(false);
        expect(Field.InputType.isValidFieldData({ quotation: 'text' }, Field.InputType.DROPDOWN)).toBe(false);
        expect(Field.InputType.isValidFieldData({ quotation: 'text' }, Field.InputType.RADIO)).toBe(false);
        expect(Field.InputType.isValidFieldData({ quotation: 'text' }, Field.InputType.CATEGORY)).toBe(false);
        expect(Field.InputType.isValidFieldData({ quotation: 'text' }, Field.InputType.MULTIINPUT)).toBe(false);
        expect(Field.InputType.isValidFieldData({ quotation: 'text' }, Field.InputType.CHECKBOXES)).toBe(false);
        expect(Field.InputType.isValidFieldData({ quotation: 'text' }, Field.InputType.UNSIGNEDINT)).toBe(false);
        expect(Field.InputType.isValidFieldData(-700, Field.InputType.UNSIGNEDINT)).toBe(false);
        expect(Field.InputType.isValidFieldData({ quotation: 'text' }, Field.InputType.UNSIGNEDFLOAT)).toBe(false);
        expect(Field.InputType.isValidFieldData(-7.5, Field.InputType.UNSIGNEDFLOAT)).toBe(false);
        expect(Field.InputType.isValidFieldData({ quotation: 'text' }, Field.InputType.FLOAT)).toBe(false);
        expect(Field.InputType.isValidFieldData({ quotation: 'text' }, Field.InputType.BOOLEAN)).toBe(false);
        expect(Field.InputType.isValidFieldData({ quotation: 'text' }, Field.InputType.DATE)).toBe(false);
        expect(Field.InputType.isValidFieldData('31-01-2010', Field.InputType.DATE)).toBe(false);
        expect(Field.InputType.isValidFieldData('31.01.2010.01', Field.InputType.DATE)).toBe(false);
        expect(Field.InputType.isValidFieldData('ABC', Field.InputType.DATE)).toBe(false);
        expect(Field.InputType.isValidFieldData('text', Field.InputType.DROPDOWNRANGE)).toBe(false);
        expect(Field.InputType.isValidFieldData('text', Field.InputType.DATING)).toBe(false);
        expect(Field.InputType.isValidFieldData('text', Field.InputType.DIMENSION)).toBe(false);
        expect(Field.InputType.isValidFieldData('text', Field.InputType.LITERATURE)).toBe(false);
        expect(Field.InputType.isValidFieldData('text', Field.InputType.GEOMETRY)).toBe(false);
        expect(Field.InputType.isValidFieldData('text', Field.InputType.RELATION)).toBe(false);
        expect(Field.InputType.isValidFieldData('text', Field.InputType.INSTANCE_OF)).toBe(false);
    });
});
