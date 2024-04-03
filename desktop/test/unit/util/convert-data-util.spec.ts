import { Field } from 'idai-field-core';
import { ConvertDataUtil } from '../../../src/app/util/convert-data-util';

/**
 * @author Thomas Kleinke
 */
describe('ConvertDataUtil', () => {

    it('detect field data as convertible', () => {

        expect (ConvertDataUtil.isConvertible('true', Field.InputType.BOOLEAN)).toBe(true);
        expect (ConvertDataUtil.isConvertible('True', Field.InputType.BOOLEAN)).toBe(true);
        expect (ConvertDataUtil.isConvertible('false', Field.InputType.BOOLEAN)).toBe(true);
        expect (ConvertDataUtil.isConvertible('False', Field.InputType.BOOLEAN)).toBe(true);
        expect (ConvertDataUtil.isConvertible('value', Field.InputType.CHECKBOXES)).toBe(true);
    });


    it('detect field data as non-convertible', () => {

        expect (ConvertDataUtil.isConvertible('value', Field.InputType.BOOLEAN)).toBe(false);
        expect (ConvertDataUtil.isConvertible({ field: 'value' }, Field.InputType.CHECKBOXES)).toBe(false);
    });


    it('convert field data', () => {

        expect (ConvertDataUtil.convert('true', Field.InputType.BOOLEAN)).toBe(true);
        expect (ConvertDataUtil.convert('True', Field.InputType.BOOLEAN)).toBe(true);
        expect (ConvertDataUtil.convert('false', Field.InputType.BOOLEAN)).toBe(false);
        expect (ConvertDataUtil.convert('False', Field.InputType.BOOLEAN)).toBe(false);
        expect (ConvertDataUtil.convert('value', Field.InputType.CHECKBOXES)).toEqual(['value']);
    });
});
