import {IdaiFieldDiffUtility} from '../../../app/core/model/idai-field-diff-utility';

/**
 * @author Daniel de Oliveira
 * @author Thomas Kleinke
 */

describe('ComparisonUtil', () => {

    it('compare', () => {

        expect(IdaiFieldDiffUtility.compare('field1', 'field1')).toBe(true);
        expect(IdaiFieldDiffUtility.compare({ field: 'value' }, { field: 'value' })).toBe(true);
        expect(IdaiFieldDiffUtility.compare(['value1', 'value2'], ['value1', 'value2'])).toBe(true);
        expect(IdaiFieldDiffUtility.compare([{ field1: 'value1' }, { field2: 'value2' }],
            [{ field1: 'value1' }, { field2: 'value2' }])).toBe(true);
        expect(IdaiFieldDiffUtility.compare(undefined, undefined)).toBe(true);

        expect(IdaiFieldDiffUtility.compare('field1', undefined)).toBe(false);
        expect(IdaiFieldDiffUtility.compare(undefined, 'field1')).toBe(false);
        expect(IdaiFieldDiffUtility.compare({ field: 'value' }, undefined)).toBe(false);
        expect(IdaiFieldDiffUtility.compare(undefined, { field: 'value' })).toBe(false);
        expect(IdaiFieldDiffUtility.compare(['value1', 'value2'], undefined)).toBe(false);
        expect(IdaiFieldDiffUtility.compare(undefined, ['value1', 'value2'])).toBe(false);

        expect(IdaiFieldDiffUtility.compare('field1', 'field2')).toBe(false);
        expect(IdaiFieldDiffUtility.compare({ field: 'value1' }, { field: 'value2' })).toBe(false);
        expect(IdaiFieldDiffUtility.compare({ field: 'value1' }, { field: 'value1', anotherField: 'value2' })).toBe(false);
        expect(IdaiFieldDiffUtility.compare(['value1', 'value2'], ['value3', 'value4'])).toBe(false);
        expect(IdaiFieldDiffUtility.compare([{ field1: 'value1' }, { field2: 'value2' }],
            [{ field2: 'value1' }, { field1: 'value2' }])).toBe(false);

        expect(IdaiFieldDiffUtility.compare('field1', { field: 'value' })).toBe(false);
        expect(IdaiFieldDiffUtility.compare('field1', ['value1', 'value2'])).toBe(false);
        expect(IdaiFieldDiffUtility.compare({ field: 'value' }, ['value1', 'value2'])).toBe(false);
    });
});