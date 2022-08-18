import { hasEmptyAssociatives } from '../../../../src/app/components/import/util';


describe('util', () => {

    it('hasEmptyAssociatives - empty array', () => {

        expect(hasEmptyAssociatives([])).toBe(true);
    });


    it('hasEmptyAssociatives - empty object', () => {

        expect(hasEmptyAssociatives({})).toBe(true);
    });


    it('hasEmptyAssociatives - filled array', () => {

        expect(hasEmptyAssociatives([1])).toBe(false);
    });


    it('hasEmptyAssociatives - filled object', () => {

        expect(hasEmptyAssociatives({ a: 1 })).toBe(false);
    });


    it('hasEmptyAssociatives - array - object - empty array', () => {

        expect(hasEmptyAssociatives([{a: []}])).toBe(true);
    });
});
