import { Resource } from "../../src/model/resource";


/**
 * @author Daniel de Oliveira
 */
describe('Resource', () => {

    it('compare', () => {

        expect(Resource.compare('field1', 'field1')).toBe(true);
        expect(Resource.compare({ field: 'value' }, { field: 'value' })).toBe(true);
        expect(Resource.compare(['value1', 'value2'], ['value1', 'value2'])).toBe(true);
        expect(Resource.compare([{ field1: 'value1' }, { field2: 'value2' }],
            [{ field1: 'value1' }, { field2: 'value2' }])).toBe(true);
        expect(Resource.compare(undefined, undefined)).toBe(true);

        expect(Resource.compare('field1', undefined)).toBe(false);
        expect(Resource.compare(undefined, 'field1')).toBe(false);
        expect(Resource.compare({ field: 'value' }, undefined)).toBe(false);
        expect(Resource.compare(undefined, { field: 'value' })).toBe(false);
        expect(Resource.compare(['value1', 'value2'], undefined)).toBe(false);
        expect(Resource.compare(undefined, ['value1', 'value2'])).toBe(false);

        expect(Resource.compare('field1', 'field2')).toBe(false);
        expect(Resource.compare({ field: 'value1' }, { field: 'value2' })).toBe(false);
        expect(Resource.compare({ field: 'value1' }, { field: 'value1', anotherField: 'value2' })).toBe(false);
        expect(Resource.compare(['value1', 'value2'], ['value3', 'value4'])).toBe(false);
        expect(Resource.compare([{ field1: 'value1' }, { field2: 'value2' }],
            [{ field2: 'value1' }, { field1: 'value2' }])).toBe(false);

        expect(Resource.compare('field1', { field: 'value' })).toBe(false);
        expect(Resource.compare('field1', ['value1', 'value2'])).toBe(false);
        expect(Resource.compare({ field: 'value' }, ['value1', 'value2'])).toBe(false);
    });
});