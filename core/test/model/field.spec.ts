import { Field } from '../../src/model/configuration/field';


/**
 * @author Thomas Kleinke
 */
 describe('Field', () => {

    function makeField(inputType): Field {

        return {
            name: 'field',
            inputType: inputType
        };
    }


    it('validate correct field data', () => {

        expect(Field.isValidFieldData('text', makeField(Field.InputType.INPUT))).toBe(true);
        expect(Field.isValidFieldData({ de: 'text1', en: 'text2' }, makeField(Field.InputType.INPUT))).toBe(true);
        expect(Field.isValidFieldData('text', makeField(Field.InputType.SIMPLE_INPUT))).toBe(true);
        expect(Field.isValidFieldData('text', makeField(Field.InputType.TEXT))).toBe(true);
        expect(Field.isValidFieldData({ de: 'text1', en: 'text2' }, makeField(Field.InputType.TEXT))).toBe(true);
        expect(Field.isValidFieldData('text', makeField(Field.InputType.DROPDOWN))).toBe(true);
        expect(Field.isValidFieldData('text', makeField(Field.InputType.RADIO))).toBe(true);
        expect(Field.isValidFieldData('text', makeField(Field.InputType.CATEGORY))).toBe(true);
        expect(Field.isValidFieldData(['a', 'b'], makeField(Field.InputType.MULTIINPUT))).toBe(true);
        expect(Field.isValidFieldData(['a', 'b'], makeField(Field.InputType.CHECKBOXES))).toBe(true);
        expect(Field.isValidFieldData(700, makeField(Field.InputType.UNSIGNEDINT))).toBe(true);
        expect(Field.isValidFieldData(7.5, makeField(Field.InputType.UNSIGNEDFLOAT))).toBe(true);
        expect(Field.isValidFieldData(-7.5, makeField(Field.InputType.FLOAT))).toBe(true);
        expect(Field.isValidFieldData(true, makeField(Field.InputType.BOOLEAN))).toBe(true);
        expect(Field.isValidFieldData(false, makeField(Field.InputType.BOOLEAN))).toBe(true);
        expect(Field.isValidFieldData('31.01.2010', makeField(Field.InputType.DATE))).toBe(true);
        expect(Field.isValidFieldData('01.2010', makeField(Field.InputType.DATE))).toBe(true);
        expect(Field.isValidFieldData('2010', makeField(Field.InputType.DATE))).toBe(true);

        expect(Field.isValidFieldData(
            { value: 'A', endValue: 'B' },
            makeField(Field.InputType.DROPDOWNRANGE)
        )).toBe(true);

        expect(Field.isValidFieldData(
            [{ type: 'single', begin: { year: 200, inputYear: 200, inputType: 'ce' } }],
            makeField(Field.InputType.DATING)
        )).toBe(true);

        expect(Field.isValidFieldData(
            [{ inputValue: 50, inputUnit: 'cm' }],
            makeField(Field.InputType.DIMENSION)
        )).toBe(true);

        expect(Field.isValidFieldData(
            [{ quotation: 'text' }],
            makeField(Field.InputType.LITERATURE)
        )).toBe(true);

        expect(Field.isValidFieldData(
            { type: 'Point', coordinates: [0.5, 1.5] },
            makeField(Field.InputType.GEOMETRY)
        )).toBe(true);

        expect(Field.isValidFieldData(
            { liesWithin: ['a', 'b'] },
            makeField(Field.InputType.RELATION)
        )).toBe(true);

        expect(Field.isValidFieldData(
            { isInstanceOf: ['a', 'b'] },
            makeField(Field.InputType.INSTANCE_OF)
        )).toBe(true);
    });


    it('validate incorrect field data', () => {

        expect(Field.isValidFieldData(700, makeField(Field.InputType.INPUT))).toBe(false);
        expect(Field.isValidFieldData({ de: 'text1', en: 'text2' }, makeField(Field.InputType.SIMPLE_INPUT)))
            .toBe(false);
        expect(Field.isValidFieldData(700, makeField(Field.InputType.TEXT))).toBe(false);
        expect(Field.isValidFieldData({ quotation: 'text' }, makeField(Field.InputType.DROPDOWN))).toBe(false);
        expect(Field.isValidFieldData({ quotation: 'text' }, makeField(Field.InputType.RADIO))).toBe(false);
        expect(Field.isValidFieldData({ quotation: 'text' }, makeField(Field.InputType.CATEGORY))).toBe(false);
        expect(Field.isValidFieldData({ quotation: 'text' }, makeField(Field.InputType.MULTIINPUT))).toBe(false);
        expect(Field.isValidFieldData({ quotation: 'text' }, makeField(Field.InputType.CHECKBOXES))).toBe(false);
        expect(Field.isValidFieldData({ quotation: 'text' }, makeField(Field.InputType.UNSIGNEDINT))).toBe(false);
        expect(Field.isValidFieldData(-700, makeField(Field.InputType.UNSIGNEDINT))).toBe(false);
        expect(Field.isValidFieldData({ quotation: 'text' }, makeField(Field.InputType.UNSIGNEDFLOAT))).toBe(false);
        expect(Field.isValidFieldData(-7.5, makeField(Field.InputType.UNSIGNEDFLOAT))).toBe(false);
        expect(Field.isValidFieldData({ quotation: 'text' }, makeField(Field.InputType.FLOAT))).toBe(false);
        expect(Field.isValidFieldData({ quotation: 'text' }, makeField(Field.InputType.BOOLEAN))).toBe(false);
        expect(Field.isValidFieldData({ quotation: 'text' }, makeField(Field.InputType.DATE))).toBe(false);
        expect(Field.isValidFieldData('31-01-2010', makeField(Field.InputType.DATE))).toBe(false);
        expect(Field.isValidFieldData('31.01.2010.01', makeField(Field.InputType.DATE))).toBe(false);
        expect(Field.isValidFieldData('ABC', makeField(Field.InputType.DATE))).toBe(false);
        expect(Field.isValidFieldData('text', makeField(Field.InputType.DROPDOWNRANGE))).toBe(false);
        expect(Field.isValidFieldData('text', makeField(Field.InputType.DATING))).toBe(false);
        expect(Field.isValidFieldData('text', makeField(Field.InputType.DIMENSION))).toBe(false);
        expect(Field.isValidFieldData('text', makeField(Field.InputType.LITERATURE))).toBe(false);
        expect(Field.isValidFieldData('text', makeField(Field.InputType.GEOMETRY))).toBe(false);
        expect(Field.isValidFieldData('text', makeField(Field.InputType.RELATION))).toBe(false);
        expect(Field.isValidFieldData('text', makeField(Field.InputType.INSTANCE_OF))).toBe(false);
    });
});
