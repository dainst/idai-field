import {ObjectUtil} from '../../../app/util/object-util';

/**
 * @author Daniel de Oliveira
 * @author Thomas Kleinke
 */
export function main() {

    describe('ObjectUtil', () => {

        it('returns el', () => {

            expect(ObjectUtil.getElForPathIn({a:{ b: { c: 'a'}}}, 'a.b.c')).toEqual('a');
        });


        it('returns undefined', () => {

            expect(ObjectUtil.getElForPathIn({a:{ }}, 'a.b.c')).toEqual(undefined);
        });


        it('takeOrMake makes', () => {

            const obj = { };
            expect(ObjectUtil.takeOrMake(obj, 'a.b.c', [])).toEqual([]);
            expect(obj['a']['b']['c']).toEqual([]);
        });


        it('takeOrMake takes', () => {

            expect(ObjectUtil.takeOrMake({a:{ b: { c: 'a'}}}, 'a.b.c', [])).toEqual('a');
        });


        it('compare', () => {

            expect(ObjectUtil.compare('field1', 'field1')).toBe(true);
            expect(ObjectUtil.compare({ field: 'value' }, { field: 'value' })).toBe(true);
            expect(ObjectUtil.compare(['value1', 'value2'], ['value1', 'value2'])).toBe(true);
            expect(ObjectUtil.compare([{ field1: 'value1' }, { field2: 'value2' }],
                [{ field1: 'value1' }, { field2: 'value2' }])).toBe(true);
            expect(ObjectUtil.compare(undefined, undefined)).toBe(true);

            expect(ObjectUtil.compare('field1', undefined)).toBe(false);
            expect(ObjectUtil.compare(undefined, 'field1')).toBe(false);
            expect(ObjectUtil.compare({ field: 'value' }, undefined)).toBe(false);
            expect(ObjectUtil.compare(undefined, { field: 'value' })).toBe(false);
            expect(ObjectUtil.compare(['value1', 'value2'], undefined)).toBe(false);
            expect(ObjectUtil.compare(undefined, ['value1', 'value2'])).toBe(false);

            expect(ObjectUtil.compare('field1', 'field2')).toBe(false);
            expect(ObjectUtil.compare({ field: 'value1' }, { field: 'value2' })).toBe(false);
            expect(ObjectUtil.compare({ field: 'value1' }, { field: 'value1', anotherField: 'value2' })).toBe(false);
            expect(ObjectUtil.compare(['value1', 'value2'], ['value3', 'value4'])).toBe(false);
            expect(ObjectUtil.compare([{ field1: 'value1' }, { field2: 'value2' }],
                [{ field2: 'value1' }, { field1: 'value2' }])).toBe(false);

            expect(ObjectUtil.compare('field1', { field: 'value' })).toBe(false);
            expect(ObjectUtil.compare('field1', ['value1', 'value2'])).toBe(false);
            expect(ObjectUtil.compare({ field: 'value' }, ['value1', 'value2'])).toBe(false);
        });


        fit('clone any clones array of array of strings', () => {

            expect(ObjectUtil.cloneAny([["a"],["b"]])).toEqual([["a"],["b"]]);
        })
    });
}