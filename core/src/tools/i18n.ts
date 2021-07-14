import { clone } from 'tsfun';
import { Named } from './named';

// TODO push down into I18N as I18N.String
export type I18nString = { [languageCode: string]: string };


/**
 * @author Thomas Kleinke
 * @author Daniel de Oliveira
 */
export namespace I18N {

    export const LABEL = 'label';
    export const DESCRIPTION = 'description';


    export interface Labeled { label?: I18nString }

    export interface LabeledValue extends Named, Labeled {};


    export function mergeI18nStrings(original: I18nString|undefined, toAdd: I18nString): I18nString {

        return Object.keys(toAdd).reduce((result, language) => {
            result[language] = toAdd[language];
            return result;
        }, clone(original ?? {}));
    }


    export function getLabel(labeledValue: LabeledValue, languages: string[]): string {

        return getTranslation(labeledValue.label, languages) ?? labeledValue.name;
    }
    

    export function getLabelAndDescription(labeledValue: LabeledValue,
                                           languages: string[]): { label: string, description?: string } {


        if (!labeledValue.label) return { label: labeledValue.name };

        const language = getLanguage(labeledValue.label, languages);
        return language
            ? {
                label: labeledValue.label[language],
                description: labeledValue?.[DESCRIPTION]?.[language]
            }
            : { 
                label: 
                labeledValue.name 
            };
    }


    /**
     * ```
     * >> getTranslations({ de: "Bla", en: "Blub" }, ["en"])
     * "Blub"  
     * >> getTranslations({ en: "Blub" }, ["de"])
     * undefined
     * ```
     */
    export function getTranslation(labels: I18nString, languages: string[]): string|undefined {

        if (!labels) return undefined;

        const language = getLanguage(labels, languages);
        return language ? labels[language] : undefined;
    }


    function getLanguage(labels: I18nString, languages: string[]): string|undefined {

        return languages.find(languageCode => labels[languageCode] !== undefined);
    }
}
