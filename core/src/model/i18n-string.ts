import { clone } from 'tsfun';


export type I18nString = { [languageCode: string]: string };


/**
 * @author Thomas Kleinke
 */
export module I18nString {
    
    export function mergeI18nStrings(original: I18nString|undefined, toAdd: I18nString): I18nString {

        return Object.keys(toAdd).reduce((result, language) => {
            result[language] = toAdd[language];
            return result;
        }, clone(original ?? {}));
    }
}
