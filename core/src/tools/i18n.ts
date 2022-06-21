import { clone } from 'tsfun';
import { Named } from './named';


/**
 * @author Thomas Kleinke
 * @author Daniel de Oliveira
 */
export namespace I18N {

    export type String = { [languageCode: string]: string };

    export interface Labeled { label?: String }

    export interface Described { description?: String }

    export interface LabeledValue extends Named, Labeled {};

    export const NO_LANGUAGE = 'noLanguage';


    export function mergeI18nStrings(original: String|undefined, toAdd: String): String {

        return Object.keys(toAdd).reduce((result, language) => {
            result[language] = toAdd[language];
            return result;
        }, clone(original ?? {}));
    }


    export function getLabel(labeledValue: LabeledValue, languages: string[]): string {

        return getTranslation(labeledValue.label, languages) ?? labeledValue.name;
    }


    export function getDescription(labeledValue: Described, languages: string[]): string {

        return getTranslation(labeledValue.description, languages);
    }
    

    export function getLabelAndDescription(labeledValue: LabeledValue,
                                           languages: string[]): { label: string, description?: string } {


        if (!labeledValue.label) {
            return {
                label: labeledValue.name,
                description: getTranslation(labeledValue['description'], languages)
            };
        }

        const language = getLanguage(labeledValue.label, languages);
        return language
            ? {
                label: labeledValue.label[language],
                description: labeledValue?.['description']?.[language]
            }
            : { 
                label: labeledValue.name,
                description: getTranslation(labeledValue['description'], languages)
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
    export function getTranslation(labels: String, languages: string[]): string|undefined {

        if (!labels) return undefined;

        const language = getLanguage(labels, languages);
        return language ? labels[language] : undefined;
    }


    function getLanguage(labels: String, languages: string[]): string|undefined {

        return languages.find(languageCode => labels[languageCode] !== undefined);
    }
}
