import { I18nString } from '../model/i18n-string';
import { LabeledValue } from './named';


const ELECTRON_CONFIG_LANGUAGES: string[] = typeof window !== 'undefined' && window.require
    ? window.require('@electron/remote').getGlobal('config').languages
    : ['de'];


/**
 * @author Thomas Kleinke
 */
export module LabelUtil {

    export function getLabel(labeledValue: LabeledValue, providedLanguages?: string[]): string {

        return getTranslation(labeledValue.label, providedLanguages) ?? labeledValue.name;
    }
    

    export function getTranslation(labels: I18nString, providedLanguages?: string[]): string|undefined {

        if (!labels) return undefined;

        const languages = providedLanguages || ELECTRON_CONFIG_LANGUAGES;

        const language: string = languages.find(languageCode => {
            return labels[languageCode] !== undefined;
        });

        return language ? labels[language] : undefined;
    }
}
