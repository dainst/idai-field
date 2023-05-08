import { LanguageConfiguration } from './language-configuration';


export interface LanguageConfigurations {
    
    default: { [language: string]: Array<LanguageConfiguration> };
    custom: { [language: string]: Array<LanguageConfiguration> };
    complete: { [language: string]: Array<LanguageConfiguration> };
}
