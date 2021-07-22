import { clone } from 'tsfun';
import { Settings } from '../../core/settings/settings';

const CONFIGURED_LANGUAGES: string[] = typeof window !== 'undefined' && window.require
    ? window.require('@electron/remote').getGlobal('config').languages
    : ['de'];

const cldr = typeof window !== 'undefined' ? window.require('cldr') : require('cldr');
const remote = typeof window !== 'undefined' ? window.require('@electron/remote') : undefined;


/**
 * @author Daniel de Oliveira
 */
export class Languages {

    public get() {

        return CONFIGURED_LANGUAGES;
    }
}


export type Language = {
    label: string;
    info?: string;
    isMainLanguage: boolean;
}

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
}
