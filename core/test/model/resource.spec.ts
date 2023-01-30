import { Resource } from '../../src/model/resource';


/**
 * @author Daniel de Oliveira
 * @author Thomas Kleinke
 */
describe('Resource', () => {

    /*
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
    */


    it('getDifferent - different order in relation', () => {

        const rels1 = { a: ['1', '3', '7'] };
        const rels2 = { a: ['7', '1', '3'] };

        expect(Resource.getDifferingRelations({ relations: rels1 } as any, { relations: rels2 } as any)).toEqual(['a']);
        expect(Resource.getDifferingRelations({ relations: rels2 } as any, { relations: rels1 } as any)).toEqual(['a']);
    });


    it('getDifferent - one relation array has less elements', () => {

        const rels1 = { a: ['1', '3', '7'] };
        const rels2 = { a: ['1', '3'] };

        expect(Resource.getDifferingRelations({ relations: rels1 } as any, { relations: rels2 } as any)).toEqual(['a']);
        expect(Resource.getDifferingRelations({ relations: rels2 } as any, { relations: rels1 } as any)).toEqual(['a']);
    });


    it('getDifferent - keys in different order', () => {

        const rels1 = { a: ['1'], b: ['1'] };
        const rels2 = { b: ['1'], a: ['1'] };

        expect(Resource.getDifferingRelations({ relations: rels1 } as any, { relations: rels2 } as any)).toEqual([]);
        expect(Resource.getDifferingRelations({ relations: rels2 } as any, { relations: rels1 } as any)).toEqual([]);
    });


    it('getDifferent - one relation array is missing', () => {

        const rels1 = { a: ['1'] };
        const rels2 = {};

        expect(Resource.getDifferingRelations({ relations: rels1 } as any, { relations: rels2 } as any)).toEqual(['a']);
        expect(Resource.getDifferingRelations({ relations: rels2 } as any, { relations: rels1 } as any)).toEqual(['a']);
    });


    it('getDifferent - empty relations', () => {

        const rels1 = {};
        const rels2 = {};

        expect(Resource.getDifferingRelations({ relations: rels1 } as any, { relations: rels2 } as any)).toEqual([]);
    });


    it('removeEmpty', () => {

        const relations = { 'a': [], 'b': null, 'c': ['value'] };
        Resource.removeEmptyRelations({ relations: relations } as any);

        expect(relations).toEqual({ 'c': ['value'] } as any);
    });


    it('equivalent', () => {

        const relA = { a: ['1', '2'], b: ['1', '2'] };
        const relB = { b: ['2', '1'], a: ['2', '1'] };
        
        expect(Resource.relationsEquivalent({ relations: relA } as any)({ relations: relB } as any)).toBeTruthy();
    });


    it('equivalent - undefined or empty', () => {

        const relA = { a: undefined };
        const relB = { a: []};

        expect(Resource.relationsEquivalent({ relations: relA } as any)({ relations: relB } as any)).toBeTruthy();
    });
});