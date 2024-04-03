import { InvalidDataUtil } from '../../src/tools/invalid-data-util';


/**
 * @author Thomas Kleinke
 */
describe('InvalidDataUtil', () => {

    let labels;


    beforeAll(() => {

        labels = jasmine.createSpyObj('labels', ['getFromI18NString']);
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


    it('Get label from I18N strings when generating label for invalid field data', () => {

        labels.getFromI18NString.and.returnValues(undefined, 'value1');

        expect(InvalidDataUtil.generateLabel(
            [{ field1: { 'de': 'value1' } }], labels)
        ).toBe('field1: value1');
    });
});
