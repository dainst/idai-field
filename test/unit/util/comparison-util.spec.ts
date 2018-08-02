import {ComparisonUtil} from '../../../app/util/comparison-util';

/**
 * @author Daniel de Oliveira
 * @author Thomas Kleinke
 */

describe('ComparisonUtil', () => {

    it('compare', () => {

        expect(ComparisonUtil.compare('field1', 'field1')).toBe(true);
        expect(ComparisonUtil.compare({ field: 'value' }, { field: 'value' })).toBe(true);
        expect(ComparisonUtil.compare(['value1', 'value2'], ['value1', 'value2'])).toBe(true);
        expect(ComparisonUtil.compare([{ field1: 'value1' }, { field2: 'value2' }],
            [{ field1: 'value1' }, { field2: 'value2' }])).toBe(true);
        expect(ComparisonUtil.compare(undefined, undefined)).toBe(true);

        expect(ComparisonUtil.compare('field1', undefined)).toBe(false);
        expect(ComparisonUtil.compare(undefined, 'field1')).toBe(false);
        expect(ComparisonUtil.compare({ field: 'value' }, undefined)).toBe(false);
        expect(ComparisonUtil.compare(undefined, { field: 'value' })).toBe(false);
        expect(ComparisonUtil.compare(['value1', 'value2'], undefined)).toBe(false);
        expect(ComparisonUtil.compare(undefined, ['value1', 'value2'])).toBe(false);

        expect(ComparisonUtil.compare('field1', 'field2')).toBe(false);
        expect(ComparisonUtil.compare({ field: 'value1' }, { field: 'value2' })).toBe(false);
        expect(ComparisonUtil.compare({ field: 'value1' }, { field: 'value1', anotherField: 'value2' })).toBe(false);
        expect(ComparisonUtil.compare(['value1', 'value2'], ['value3', 'value4'])).toBe(false);
        expect(ComparisonUtil.compare([{ field1: 'value1' }, { field2: 'value2' }],
            [{ field2: 'value1' }, { field1: 'value2' }])).toBe(false);

        expect(ComparisonUtil.compare('field1', { field: 'value' })).toBe(false);
        expect(ComparisonUtil.compare('field1', ['value1', 'value2'])).toBe(false);
        expect(ComparisonUtil.compare({ field: 'value' }, ['value1', 'value2'])).toBe(false);
    });
});