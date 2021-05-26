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


    export function getLabelAndDescription(labeledValue: LabeledValue,
                                           providedLanguages?: string[]): { label: string, description?: string } {

                        
        if (!labeledValue.label) return { label: labeledValue.name };

        const language = getLanguage(labeledValue.label, providedLanguages);
        return language
            ? {
                label: labeledValue.label[language],
                description: labeledValue?.['description']?.[language]
            }
            : { label: labeledValue.name };
    }
    

    export function getTranslation(labels: I18nString, providedLanguages?: string[]): string|undefined {

        if (!labels) return undefined;

        const language = getLanguage(labels, providedLanguages);
        return language ? labels[language] : undefined;
    }


    function getLanguage(labels: I18nString, providedLanguages?: string[]): string|undefined {

        const languages = providedLanguages || ELECTRON_CONFIG_LANGUAGES;
        return languages.find(languageCode => labels[languageCode] !== undefined);
    }
}
