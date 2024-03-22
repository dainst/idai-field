import { Valuelist } from '../../src/model/configuration/valuelist';
import { ValuelistUtil } from '../../src/tools/valuelist-util';

/**
 * @author Thomas Kleinke
 */
describe('ValuelistUtil', () => {
    
    it('get values not included in valuelist', () => {
        
        const valuelist: Valuelist = {
            values: { value1: {}, value2: {} }
        };

        expect(ValuelistUtil.getValuesNotIncludedInValuelist('value1', valuelist)).toBeUndefined();
        expect(ValuelistUtil.getValuesNotIncludedInValuelist(['value1', 'value2'], valuelist)).toBeUndefined();
        expect(ValuelistUtil.getValuesNotIncludedInValuelist({ value: 'value1' }, valuelist)).toBeUndefined();
        expect(ValuelistUtil.getValuesNotIncludedInValuelist({ value: 'value1', endValue: 'value2' }, valuelist))
            .toBeUndefined();
        expect(ValuelistUtil.getValuesNotIncludedInValuelist([{ measurementPosition: 'value1' }], valuelist))
            .toBeUndefined();

        expect(ValuelistUtil.getValuesNotIncludedInValuelist('value3', valuelist)).toEqual(['value3'])
        expect(ValuelistUtil.getValuesNotIncludedInValuelist(['value1', 'value2', 'value3'], valuelist))
            .toEqual(['value3']);
        expect(ValuelistUtil.getValuesNotIncludedInValuelist({ value: 'value3' }, valuelist)).toEqual(['value3']);
        expect(ValuelistUtil.getValuesNotIncludedInValuelist({ value: 'value1', endValue: 'value3' }, valuelist))
            .toEqual(['value3']);
        expect(ValuelistUtil.getValuesNotIncludedInValuelist([{ measurementPosition: 'value3' }], valuelist))
            .toEqual(['value3']);
    })
});
