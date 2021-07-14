import { I18nString } from '../model/i18n-string';
import { Named } from './named';


export interface Labeled { label?: I18nString }

export interface LabeledValue extends Named, Labeled {};


/**
 * @author Thomas Kleinke
 */
export namespace Labeled {

    export const LABEL = 'label';


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
                description: labeledValue?.['description']?.[language]
            }
            : { label: labeledValue.name };
    }
    

    export function getTranslation(labels: I18nString, languages: string[]): string|undefined {

        if (!labels) return undefined;

        const language = getLanguage(labels, languages);
        return language ? labels[language] : undefined;
    }


    function getLanguage(labels: I18nString, languages: string[]): string|undefined {

        return languages.find(languageCode => labels[languageCode] !== undefined);
    }
}
