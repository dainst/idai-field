import { Field } from '../../src/model/configuration/field';
import { InvalidDataUtil } from '../../src/tools/invalid-data-util';


/**
 * @author Thomas Kleinke
 */
describe('InvalidDataUtil', () => {

    let labels;


    beforeAll(() => {

        labels = jasmine.createSpyObj('labels', ['getFromI18NString']);
    });


    it('detect field data as convertible', () => {

        expect (InvalidDataUtil.isConvertible('true', Field.InputType.BOOLEAN)).toBe(true);
        expect (InvalidDataUtil.isConvertible('True', Field.InputType.BOOLEAN)).toBe(true);
        expect (InvalidDataUtil.isConvertible('false', Field.InputType.BOOLEAN)).toBe(true);
        expect (InvalidDataUtil.isConvertible('False', Field.InputType.BOOLEAN)).toBe(true);
        expect (InvalidDataUtil.isConvertible('value', Field.InputType.CHECKBOXES)).toBe(true);
        expect (InvalidDataUtil.isConvertible(['value'], Field.InputType.DROPDOWN)).toBe(true);
        expect (InvalidDataUtil.isConvertible(['value'], Field.InputType.RADIO)).toBe(true);
    });


    it('detect field data as non-convertible', () => {

        expect (InvalidDataUtil.isConvertible('value', Field.InputType.BOOLEAN)).toBe(false);
        expect (InvalidDataUtil.isConvertible({ field: 'value' }, Field.InputType.CHECKBOXES)).toBe(false);
        expect (InvalidDataUtil.isConvertible(['value1', 'value2'], Field.InputType.DROPDOWN)).toBe(false);
        expect (InvalidDataUtil.isConvertible(['value1', 'value2'], Field.InputType.RADIO)).toBe(false);
        expect (InvalidDataUtil.isConvertible([{ field: 'value' }], Field.InputType.DROPDOWN)).toBe(false);
        expect (InvalidDataUtil.isConvertible([{ field: 'value' }], Field.InputType.RADIO)).toBe(false);
    });


    it('convert field data', () => {

        expect (InvalidDataUtil.convert('true', Field.InputType.BOOLEAN)).toBe(true);
        expect (InvalidDataUtil.convert('True', Field.InputType.BOOLEAN)).toBe(true);
        expect (InvalidDataUtil.convert('false', Field.InputType.BOOLEAN)).toBe(false);
        expect (InvalidDataUtil.convert('False', Field.InputType.BOOLEAN)).toBe(false);
        expect (InvalidDataUtil.convert('value', Field.InputType.CHECKBOXES)).toEqual(['value']);
        expect (InvalidDataUtil.convert(['value'], Field.InputType.DROPDOWN)).toEqual('value');
        expect (InvalidDataUtil.convert(['value'], Field.InputType.RADIO)).toEqual('value');
    });


    it('generate label for invalid field data', () => {

        expect(InvalidDataUtil.generateLabel(
            { field: 'value' }, labels)
        ).toBe('field: value');

        expect(InvalidDataUtil.generateLabel(
            [{ field: 'value1' }, { field: 'value2' }], labels)
        ).toBe('field: value1<hr>field: value2');

        expect(InvalidDataUtil.generateLabel(
            [{ field1: ['value1', 'value2'] , field2: ['value3', 'value4'] }], labels)
        ).toBe('field1: value1/value2, field2: value3/value4');

        expect(InvalidDataUtil.generateLabel('value', labels)).toBe('value');
        expect(InvalidDataUtil.generateLabel(7, labels)).toBe('7');
        expect(InvalidDataUtil.generateLabel(['value1', 'value2'], labels)).toBe('value1<hr>value2');
        expect(InvalidDataUtil.generateLabel({}, labels)).toBe('');
        expect(InvalidDataUtil.generateLabel([{}, {}], labels)).toBe('');
        expect(InvalidDataUtil.generateLabel(undefined, labels)).toBe('');
    });


    it('get label from I18N strings when generating label for invalid field data', () => {

        labels.getFromI18NString.and.returnValues(undefined, 'value1');

        expect(InvalidDataUtil.generateLabel(
            [{ field1: { 'de': 'value1' } }], labels)
        ).toBe('field1: value1');
    });
});
