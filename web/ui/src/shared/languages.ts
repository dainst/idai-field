import { set } from 'tsfun';
import { I18N } from 'idai-field-core';
import { I18nString, LabeledValue } from '../api/document';

export const USER_INTERFACE_LANGUAGES = ['en', 'de'];

export const LANGUAGES: string[] = initializeLanguages();


export function getUserInterfaceLanguage(): string {

    return LANGUAGES.find(language => USER_INTERFACE_LANGUAGES.includes(language));
}


export function getLabel(value: LabeledValue): string {

    const language: string = LANGUAGES.find((lang: string) => value.label[lang]);
    return language ? value.label[language] : value.name;
}


export function getNumberOfUndisplayedLabels(label: I18nString): number {

    return Object.keys(label).length - (LANGUAGES.find((lang: string) => label[lang]) ? 1 : 0);
}


function initializeLanguages(): string[] {

    return set(
        window.navigator.languages
            .map(getBasicLanguageCode)
            .filter(language => language.length === 2)
            .concat(USER_INTERFACE_LANGUAGES.concat('unspecifiedLanguage'))
    );
}


function getBasicLanguageCode(language: string): string {

    const index: number = language.indexOf('-');
    return index > 0 ? language.substring(0, index) : language;
}


export function getTranslation(labels: I18N.String|undefined): string {

    if (!labels) return '';
    if (!LANGUAGES) {
        console.warn('getTranslation complains: LANGUAGES not populated yet');
        return '';
    }
    return I18N.getTranslation(labels, LANGUAGES) ?? '';
}
