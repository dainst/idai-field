import { compare } from '../../src/tools/compare';


describe('compare', () => {

    it('compare', () => {

        expect(compare('1', '1')).toBe(true);
        expect(compare(1, 1)).toBe(true);
        expect(compare(['1', '2'], ['1', '2'])).toBe(true);
        expect(compare(undefined, undefined)).toBe(true);

        expect(compare('1', undefined)).toBe(false);
        expect(compare(1, '1')).toBe(false);
        expect(compare(['1', '2'], ['2', '1'])).toBe(false);
        expect(compare(['1', '2'], ['1', '2', '3'])).toBe(false);
        expect(compare('1', { a: '1' })).toBe(false);
        expect(compare({ a: '1' }, '1')).toBe(false);
    });


    it('compare objects with same key order', () => {

        const object1 = { a: '1', b: '2' };
        const object2 = { a: '1', b: '2' };
        const object3 = { a: '1', b: '3' };

        expect(compare(object1, object2)).toBe(true);
        expect(compare(object1, object3)).toBe(false);
    });


    it('compare objects with different key order', () => {

        const object1 = { a: '1', b: '2' };
        const object2 = { b: '2', a: '1' };
        const object3 = { b: '3', a: '1' };

        expect(compare(object1, object2)).toBe(true);
        expect(compare(object1, object3)).toBe(false);
    });
});
