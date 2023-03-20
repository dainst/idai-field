import { set } from 'tsfun';
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
            .concat(USER_INTERFACE_LANGUAGES)
    );
}


function getBasicLanguageCode(language: string): string {

    const index: number = language.indexOf('-');
    return index > 0 ? language.substring(0, index) : language;
}


// TODO move this to idai-field core or re-use functions from there
export function getLangStr(object) {

    if (!object) return undefined;

    const firstKey = Object.keys(object)[0];
    return object[firstKey];
}
