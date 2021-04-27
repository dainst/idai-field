import { Relations } from "../../src/model/relations";


/**
 * @author Daniel de Oliveira
 * @author Thomas Kleinke
 */
describe('Relations', () => {

    it('getDifferent - different order in relation', () => {

        const rels1 = { a: ['1', '3', '7'] };
        const rels2 = { a: ['7', '1', '3'] };

        expect(Relations.getDifferent(rels1, rels2)).toEqual(['a']);
        expect(Relations.getDifferent(rels2, rels1)).toEqual(['a']);
    });


    it('getDifferent - one relation array has less elements', () => {

        const rels1 = { a: ['1', '3', '7'] };
        const rels2 = { a: ['1', '3'] };

        expect(Relations.getDifferent(rels1, rels2)).toEqual(['a']);
        expect(Relations.getDifferent(rels2, rels1)).toEqual(['a']);
    });


    it('getDifferent - keys in different order', () => {

        const rels1 = { a: ['1'], b: ['1'] };
        const rels2 = { b: ['1'], a: ['1'] };

        expect(Relations.getDifferent(rels1, rels2)).toEqual([]);
        expect(Relations.getDifferent(rels2, rels1)).toEqual([]);
    });


    it('getDifferent - one relation array is missing', () => {

        const rels1 = { a: ['1'] };
        const rels2 = {};

        expect(Relations.getDifferent(rels1, rels2)).toEqual(['a']);
        expect(Relations.getDifferent(rels2, rels1)).toEqual(['a']);
    });


    it('getDifferent - empty relations', () => {

        const rels1 = {};
        const rels2 = {};

        expect(Relations.getDifferent(rels1, rels2)).toEqual([]);
    });


    it('removeEmpty', () => {

        const relations = { 'a': [], 'b': null, 'c': ['value'] };
        Relations.removeEmpty(relations);

        expect(relations).toEqual({ 'c': ['value'] } as any);
    });


    it('equivalent', () => {

        const relA = { a: ['1', '2'], b: ['1', '2'] };
        const relB = { b: ['2', '1'], a: ['2', '1'] };
        
        expect(Relations.equivalent(relA)(relB)).toBeTruthy();
    });
});
