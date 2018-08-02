import {ComparisonUtil} from '../../../app/util/comparison-util';
import {ObjectUtil} from "../../../app/util/object-util";

/**
 * @author Daniel de Oliveira
 * @author Thomas Kleinke
 */

describe('ComparisonUtil', () => {

    it('clone object with dates', () => {

       const original = {
           a: {
               a1: new Date(),
               a2: ''
           },
           b: new Date(),
           c: ''
       };

       const cloned = ObjectUtil.cloneWithDates(original);

       expect(cloned.a.a1 instanceof Date).toBeTruthy();
       expect(cloned.a.a2 as any).toEqual('');
       expect(cloned.b instanceof Date).toBeTruthy();
       expect(cloned.c as any).toEqual('');
    });


    it('clones are independent', () => {

        const original = {
            a: {
                a1: new Date(),
                a2: ''
            },
            b: new Date(),
            c: ''
        };

        const cloned = ObjectUtil.cloneWithDates(original);

        original["a"] = "" as any;
        delete original["b"];
        original["c"] = new Date() as any;

        expect(cloned.a.a1 instanceof Date).toBeTruthy();
        expect(cloned.a.a2).toEqual('');
        expect(cloned.b instanceof Date).toBeTruthy();
        expect(cloned.c).toEqual('');
    });


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