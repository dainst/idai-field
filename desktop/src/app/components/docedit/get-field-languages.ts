import { isObject, set, Map } from 'tsfun';
import { I18N } from 'idai-field-core';
import { Language } from '../../services/languages';


/**
 * @author Thomas Kleinke
 */
export function getFieldLanguages(fieldContent: any, languages: Map<Language>, projectLanguages: string[],
                                  settingsLanguages: string[], noLanguageLabel: string): Array<Language> {

    const configuredLanguages: string[] = getConfiguredLanguages(projectLanguages);
    const fieldLanguages: string[] = set(getUsedLanguages(fieldContent, languages).concat(configuredLanguages));

    return fieldLanguages.sort((language1, language2) => {
        return getIndexForSorting(settingsLanguages, language1)
            - getIndexForSorting(settingsLanguages, language2);
    }).map(languageCode => getLanguage(languageCode, languages, noLanguageLabel));
}


function getConfiguredLanguages(projectLanguages: string[]): string[] {

    return projectLanguages.length > 0
        ? projectLanguages
        : [I18N.UNSPECIFIED_LANGUAGE];
}


function getUsedLanguages(fieldContent: any, languages: Map<Language>): string[] {
    
    if (!fieldContent) return [];
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


function getIndexForSorting(settingsLanguages: string[], language: string): number {

    const index: number = settingsLanguages.indexOf(language);
    return index === -1
        ? language === I18N.UNSPECIFIED_LANGUAGE
            ? -1
            : 1000000
        : index;
}
