import { CustomCategoryDefinition } from '../configuration';
import { LanguageConfiguration } from '../configuration/model/language-configuration';
import { Resource } from './resource';


export interface ConfigurationResource extends Resource {

    categories: { [formName: string]: CustomCategoryDefinition };
    languages: { [language: string]: LanguageConfiguration };
}
