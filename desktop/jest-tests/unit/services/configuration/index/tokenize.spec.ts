import { describe, expect, test } from '@jest/globals';
import { tokenize } from '../../../../../src/app/services/configuration/index/tokenize';


/**
 * @author Thomas Kleinke
 */
describe('tokenize', () => {

    test('tokenize', async () => {

        expect(tokenize(['ab-cd-ef'])).toEqual(['ab', 'cd', 'ef', 'ab-cd-ef']);
        expect(tokenize(['ab_cd_ef'])).toEqual(['ab', 'cd', 'ef', 'ab_cd_ef']);
        expect(tokenize(['ab cd ef'])).toEqual(['ab', 'cd', 'ef', 'ab cd ef']);
        expect(tokenize(['ab.cd.ef'])).toEqual(['ab', 'cd', 'ef', 'ab.cd.ef']);
        expect(tokenize(['ab:cd:ef'])).toEqual(['ab', 'cd', 'ef', 'ab:cd:ef']);
        expect(tokenize(['ab..ef'])).toEqual(['ab', 'ef', 'ab..ef']);
        expect(tokenize(['ab-cd', 'ef gh'])).toEqual(['ab', 'cd', 'ab-cd', 'ef', 'gh', 'ef gh']);
    });
});
