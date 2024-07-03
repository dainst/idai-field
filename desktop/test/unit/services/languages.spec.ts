import { describe, expect, test } from '@jest/globals';
import { Map, to } from 'tsfun';
import { I18N, Document } from 'idai-field-core';
import { Languages, Language } from '../../../src/app/services/languages';


/**
 * @author Thomas Kleinke
 */
describe('languages', () => {

    const languages: Map<Language> = {
        de: { code: 'de', label: 'DE', isMainLanguage: true },
        en: { code: 'en', label: 'EN', isMainLanguage: true },
        it: { code: 'it', label: 'IT', isMainLanguage: true },
        fr: { code: 'fr', label: 'FR', isMainLanguage: false },
        uk: { code: 'uk', label: 'UK', isMainLanguage: false },
        es: { code: 'es', label: 'ES', isMainLanguage: false }
    };
    

    test('get field languages for i18n string', () => {

        const projectLanguages: string[] = ['de', 'en', 'fr'];
        const settingsLanguages: string[] = ['en', 'it', 'es', 'de'];
        const fieldContent: I18N.String = { de: 'A', uk: 'B', it: 'C' };

        const result: Array<Language> = Languages.getFieldLanguages(
            fieldContent, languages, projectLanguages, settingsLanguages, 'Unspecified language'
        );

        expect(result.map(to('code'))).toEqual(['en', 'it', 'de', 'uk', 'fr']);
    });


    test('get field languages for string', () => {

        const projectLanguages: string[] = ['de', 'en', 'fr'];
        const settingsLanguages: string[] = ['en', 'it', 'es', 'de'];
        const fieldContent: string = 'A';

        const result: Array<Language> = Languages.getFieldLanguages(
            fieldContent, languages, projectLanguages, settingsLanguages, 'Unspecified language'
        );

        expect(result.map(to('code'))).toEqual([I18N.UNSPECIFIED_LANGUAGE, 'en', 'de', 'fr']);
    });


    test('get field languages for undefined value', () => {

        const projectLanguages: string[] = ['de', 'en', 'fr'];
        const settingsLanguages: string[] = ['en', 'it', 'es', 'de'];

        const result: Array<Language> = Languages.getFieldLanguages(
            undefined, languages, projectLanguages, settingsLanguages, 'Unspecified language'
        );

        expect(result.map(to('code'))).toEqual(['en', 'de', 'fr']);
    });


    test('get field languages for multiple documents', () => {

        const projectLanguages: string[] = ['de', 'en', 'fr'];
        const settingsLanguages: string[] = ['en', 'it', 'es', 'de'];
        
        const documents: Array<Document> = [
            { resource: { 'field': { de: 'A', it: 'B' } } } as any,
            { resource: { 'field': { uk: 'C', en: 'D' } } } as any,
        ]

        const result: Array<Language> = Languages.getDocumentsLanguages(
            documents, 'field', languages, projectLanguages, settingsLanguages, 'Unspecified language'
        );

        expect(result.map(to('code'))).toEqual(['en', 'it', 'de', 'uk', 'fr']);
    });


    test('get field languages for multiple documents containing string values', () => {

        const projectLanguages: string[] = ['de', 'en', 'fr'];
        const settingsLanguages: string[] = ['en', 'it', 'es', 'de'];
        
        const documents: Array<Document> = [
            { resource: { 'field': { de: 'A', uk: 'B' } } } as any,
            { resource: { 'field': 'C' } } as any,
        ]

        const result: Array<Language> = Languages.getDocumentsLanguages(
            documents, 'field', languages, projectLanguages, settingsLanguages, 'Unspecified language'
        );

        expect(result.map(to('code'))).toEqual([I18N.UNSPECIFIED_LANGUAGE, 'en', 'de', 'uk', 'fr']);
    });


    test('get unselected languages', () => {

        const selectedLanguages: string[] = ['de', 'en', 'fr'];
        const unselectedLanguages: Map<Language> = Languages.getUnselectedLanguages(languages, selectedLanguages);

        expect(Object.keys(unselectedLanguages)).toEqual(['it', 'uk', 'es']);
    });
});
