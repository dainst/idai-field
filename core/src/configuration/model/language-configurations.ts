import { clone } from 'tsfun';
import { LanguageConfiguration } from './language-configuration';


export interface LanguageConfigurations {
    
    default: { [language: string]: Array<LanguageConfiguration> };
    custom: { [language: string]: LanguageConfiguration };
}


/**
 * @author Thomas Kleinke
 */
export module LanguageConfigurations {

    export function getCombined(languageConfigurations: LanguageConfigurations)
            : { [language: string]: Array<LanguageConfiguration> } {

        return Object.keys(languageConfigurations.custom).reduce((result, language) => {
            if (!result[language]) result[language] = [];
            result[language].unshift(languageConfigurations.custom[language]);
            return result;
        }, clone(languageConfigurations.default));
    }
}
