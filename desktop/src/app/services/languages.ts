import { clone, flatten, isObject, isArray, Map, set } from 'tsfun';
import { I18N, Document } from 'idai-field-core';
import { Settings } from './settings/settings';

const remote = window.require('@electron/remote');
const cldr = window.require('cldr');


const CONFIGURED_LANGUAGES: string[] = remote ? remote.getGlobal('config').languages : ['de'];


/**
 * @author Daniel de Oliveira
 */
export class Languages {

    public get() {

        return CONFIGURED_LANGUAGES;
    }
}


export type Language = {
    code: string,
    label: string;
    info?: string;
    isMainLanguage: boolean;
};


/**
 * @author Thomas Kleinke
 */
export namespace Languages {

    export function getAvailableLanguages(): { [languageCode: string]: Language } {

        const languages = cldr.extractLanguageDisplayNames(Settings.getLocale());
        const mainLanguages: string[] = remote.getGlobal('getMainLanguages')();

        return Object.keys(languages).reduce((result, languageCode) => {
            if (languageCode.length === 2 ) {
                result[languageCode] = {
                    code: languageCode,
                    label: languages[languageCode][0].toUpperCase() + languages[languageCode].slice(1),
                    isMainLanguage: mainLanguages.includes(languageCode)
                };
            }
            return result;
        }, {});
    }


    export function getUnselectedLanguages(availableLanguages: { [languageCode: string]: Language },
                                           selectedLanguages: string[]): { [languageCode: string]: Language } {

        const result = clone(availableLanguages);

        Object.keys(availableLanguages).forEach(languageCode => {
            if (selectedLanguages.includes(languageCode)) delete result[languageCode];
        });

        return result;
    }


    export function getSortedLanguageCodes(languages: { [languageCode: string]: Language }): string[] {

        return Object.keys(languages).sort((a: string, b: string) => {
            return languages[a].label.localeCompare(languages[b].label);
        });
    }


    export function getFieldLanguages(fieldContent: any, languages: Map<Language>, projectLanguages: string[],
                                      settingsLanguages: string[], noLanguageLabel: string): Array<Language> {

        const configuredLanguages: string[] = getConfiguredLanguages(projectLanguages);
        const fieldLanguages: string[] = set(getUsedLanguages(fieldContent, languages).concat(configuredLanguages));

        return getSortedLanguages(fieldLanguages, settingsLanguages, languages, noLanguageLabel);
    }


    export function getDocumentsLanguages(documents: Array<Document>, fieldName: string, languages: Map<Language>,
                                          projectLanguages: string[], settingsLanguages: string[],
                                          noLanguageLabel: string) {

        const configuredLanguages: string[] = getConfiguredLanguages(projectLanguages);
        const documentsLanguages: string[] = set(flatten(documents.map(document => {
            return getUsedLanguages(document.resource[fieldName], languages);
        })).concat(configuredLanguages));

        return getSortedLanguages(documentsLanguages, settingsLanguages, languages, noLanguageLabel);
    }


    function getConfiguredLanguages(projectLanguages: string[]): string[] {

        return projectLanguages.length > 0
            ? projectLanguages
            : [I18N.UNSPECIFIED_LANGUAGE];
    }


    function getUsedLanguages(fieldContent: any, languages: Map<Language>): string[] {
        
        if (!fieldContent) return [];
        if (isArray(fieldContent)) return set(flatten(fieldContent.map(entry => getUsedLanguages(entry, languages))));
        if (!isObject(fieldContent)) return [I18N.UNSPECIFIED_LANGUAGE];

        return Object.keys(fieldContent).filter(languageCode => {
            return languages[languageCode] || languageCode === I18N.UNSPECIFIED_LANGUAGE;
        });
    }


    function getLanguage(languageCode: string, languages: Map<Language>, noLanguageLabel: string): Language {

        return languageCode === I18N.UNSPECIFIED_LANGUAGE
            ? {
                code: languageCode,
                label: noLanguageLabel,
                isMainLanguage: false
            }
            : languages[languageCode]
    }


    function getSortedLanguages(languagesToSort: string[], settingsLanguages: string[], languages: Map<Language>,
                                noLanguageLabel: string) {

        return languagesToSort.sort((language1, language2) => {
            return getIndexForSorting(settingsLanguages, language1)
                - getIndexForSorting(settingsLanguages, language2);
        }).map(languageCode => getLanguage(languageCode, languages, noLanguageLabel));
    }


    function getIndexForSorting(settingsLanguages: string[], language: string): number {

        const index: number = settingsLanguages.indexOf(language);
        return index === -1
            ? language === I18N.UNSPECIFIED_LANGUAGE
                ? -1
                : 1000000
            : index;
    }
}
