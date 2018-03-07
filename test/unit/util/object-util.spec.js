"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var object_util_1 = require("../../../app/util/object-util");
/**
 * @author Daniel de Oliveira
 * @author Thomas Kleinke
 */
describe('ObjectUtil', function () {
    it('returns el', function () {
        expect(object_util_1.ObjectUtil.getElForPathIn({ a: { b: { c: 'a' } } }, 'a.b.c')).toEqual('a');
    });
    it('returns undefined', function () {
        expect(object_util_1.ObjectUtil.getElForPathIn({ a: {} }, 'a.b.c')).toEqual(undefined);
    });
    it('takeOrMake makes', function () {
        var obj = {};
        expect(object_util_1.ObjectUtil.takeOrMake(obj, 'a.b.c', [])).toEqual([]);
        expect(obj['a']['b']['c']).toEqual([]);
    });
    it('takeOrMake takes', function () {
        expect(object_util_1.ObjectUtil.takeOrMake({ a: { b: { c: 'a' } } }, 'a.b.c', [])).toEqual('a');
    });
    it('compare', function () {
        expect(object_util_1.ObjectUtil.compare('field1', 'field1')).toBe(true);
        expect(object_util_1.ObjectUtil.compare({ field: 'value' }, { field: 'value' })).toBe(true);
        expect(object_util_1.ObjectUtil.compare(['value1', 'value2'], ['value1', 'value2'])).toBe(true);
        expect(object_util_1.ObjectUtil.compare([{ field1: 'value1' }, { field2: 'value2' }], [{ field1: 'value1' }, { field2: 'value2' }])).toBe(true);
        expect(object_util_1.ObjectUtil.compare(undefined, undefined)).toBe(true);
        expect(object_util_1.ObjectUtil.compare('field1', undefined)).toBe(false);
        expect(object_util_1.ObjectUtil.compare(undefined, 'field1')).toBe(false);
        expect(object_util_1.ObjectUtil.compare({ field: 'value' }, undefined)).toBe(false);
        expect(object_util_1.ObjectUtil.compare(undefined, { field: 'value' })).toBe(false);
        expect(object_util_1.ObjectUtil.compare(['value1', 'value2'], undefined)).toBe(false);
        expect(object_util_1.ObjectUtil.compare(undefined, ['value1', 'value2'])).toBe(false);
        expect(object_util_1.ObjectUtil.compare('field1', 'field2')).toBe(false);
        expect(object_util_1.ObjectUtil.compare({ field: 'value1' }, { field: 'value2' })).toBe(false);
        expect(object_util_1.ObjectUtil.compare({ field: 'value1' }, { field: 'value1', anotherField: 'value2' })).toBe(false);
        expect(object_util_1.ObjectUtil.compare(['value1', 'value2'], ['value3', 'value4'])).toBe(false);
        expect(object_util_1.ObjectUtil.compare([{ field1: 'value1' }, { field2: 'value2' }], [{ field2: 'value1' }, { field1: 'value2' }])).toBe(false);
        expect(object_util_1.ObjectUtil.compare('field1', { field: 'value' })).toBe(false);
        expect(object_util_1.ObjectUtil.compare('field1', ['value1', 'value2'])).toBe(false);
        expect(object_util_1.ObjectUtil.compare({ field: 'value' }, ['value1', 'value2'])).toBe(false);
    });
});
//# sourceMappingURL=object-util.spec.js.map