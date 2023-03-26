import { set } from 'tsfun';
import { I18N } from 'idai-field-core';
import { I18nString, LabeledValue } from '../api/document';

export const USER_INTERFACE_LANGUAGES = ['en', 'de', 'unspecifiedLanguage'];

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


// TODO incorporate the additive changes made here into idai-field-core#I18N.getTranslation
// TODO should we accept an `undefined` labels argument?
// TODO review initialization order; are we sure LANGUAGES (passed in as languages argument; see above)
// is populated yet?
// Note that we probably want to return a string here in any case, in contrast to I18N.getTranslation,
// which may return undefined.
export function getTranslation(labels: I18N.String|undefined): string {

    if (!labels) return '';
    if (!LANGUAGES) {
        console.warn('getTranslation complains: LANGUAGES not populated yet');
        return '';
    }

    let translated = I18N.getTranslation(labels, LANGUAGES);
    if (translated) return translated;

    // TODO think about what we return here

    translated = labels['unspecifiedLanguage'];
    if (translated) return translated;

    const firstKey = Object.keys(labels)[0];
    translated = labels[firstKey];
    if (translated) return translated;

    // TODO END
    throw Error('getTranslation cannot translate');
}
