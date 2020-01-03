import {hasEmptyAssociatives} from '../../../../../../app/core/import/import/process/has-empty-associatives';


describe('hasEmptyAssociatives', () => {

    it('empty array', () => {

        expect(hasEmptyAssociatives([])).toBe(true);
    });


    it('empty object', () => {

        expect(hasEmptyAssociatives({})).toBe(true);
    });


    it('filled array', () => {

        expect(hasEmptyAssociatives([1])).toBe(false);
    });


    it('filled object', () => {

        expect(hasEmptyAssociatives({ a: 1 })).toBe(false);
    });


    it('array - object - empty array', () => {

        expect(hasEmptyAssociatives([{a: []}])).toBe(true);
    });
});