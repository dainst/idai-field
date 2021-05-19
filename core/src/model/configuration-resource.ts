import { CustomCategoryDefinition } from '../configuration';
import { Resource } from './resource';


export interface ConfigurationResource extends Resource {

    categories: { [formName: string]: CustomCategoryDefinition };
    languages: { [language: string]: any };
}
