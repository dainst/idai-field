import { Map } from 'tsfun';
import { CustomFormDefinition } from '../../configuration/model/form/custom-form-definition';
import { LanguageConfiguration } from '../../configuration/model/language/language-configuration';
import { I18N } from '../../tools';


export interface Template extends I18N.LabeledValue, I18N.Described {

    author: string;
    configuration: {
        forms: Map<CustomFormDefinition>;
        order: string[];
        languages: { [language: string]: LanguageConfiguration };
    }
}
