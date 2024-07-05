import { describe, expect, test } from '@jest/globals';
import { hasEmptyAssociatives } from '../../../../src/app/components/import/util';


describe('util', () => {

    test('hasEmptyAssociatives - empty array', () => {

        expect(hasEmptyAssociatives([])).toBe(true);
    });


    test('hasEmptyAssociatives - empty object', () => {

        expect(hasEmptyAssociatives({})).toBe(true);
    });


    test('hasEmptyAssociatives - filled array', () => {

        expect(hasEmptyAssociatives([1])).toBe(false);
    });


    test('hasEmptyAssociatives - filled object', () => {

        expect(hasEmptyAssociatives({ a: 1 })).toBe(false);
    });


    test('hasEmptyAssociatives - array - object - empty array', () => {

        expect(hasEmptyAssociatives([{a: []}])).toBe(true);
    });
});
