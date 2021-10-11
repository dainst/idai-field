import { CustomFormDefinition } from '../configuration/model/form/custom-form-definition';
import { LanguageConfiguration } from '../configuration/model/language/language-configuration';
import { Resource } from './resource';


export interface ConfigurationResource extends Resource {

    forms: { [formName: string]: CustomFormDefinition };
    languages: { [language: string]: LanguageConfiguration };
    order: string[];
}
