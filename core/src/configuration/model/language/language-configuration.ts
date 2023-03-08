import { I18N } from '../../../tools/i18n';


export interface LanguageConfiguration {

    categories?: { [categoryName: string]: CategoryLanguageDefinition };
    forms?: { [categoryName: string]: FormLanguageDefinition };
    relations?: { [relationName: string]: FieldLanguageDefinition };
    groups?: { [groupName: string]: string };
    commons?: { [fieldName: string]: FieldLanguageDefinition };
    fields?: { [fieldName: string]: FieldLanguageDefinition };
}


export interface CategoryLanguageDefinition {

    label?: string;
    description?: string;
    fields?: { [fieldName: string]: FieldLanguageDefinition };
}


export interface FormLanguageDefinition {

    description?: string;
    fields?: { [fieldName: string]: FieldLanguageDefinition };
}


export interface FieldLanguageDefinition {

    label?: string;
    description?: string;
}


/**
 * @author Thomas Kleinke
 */
export module LanguageConfiguration {

    export function getI18nString(languageConfigurations: { [language: string]: Array<LanguageConfiguration> },
                                  section: 'categories'|'forms'|'relations'|'groups'|'commons'
                                  |'fields'|'other', subSectionName: string, fields: boolean,
                                  textType?: 'label'|'description', categoryOrFormName?: string): I18N.String {

        return Object.keys(languageConfigurations).reduce((labels, language) => {

            const configuration = languageConfigurations[language].find(config => {
                const fieldConfiguration = fields
                    ? config[section]?.[categoryOrFormName]?.fields?.[subSectionName]
                    : config[section]?.[subSectionName];
                return fieldConfiguration && (!textType || fieldConfiguration[textType]);
            });

            if (configuration) {
                 const element = fields
                    ? configuration[section]?.[categoryOrFormName].fields[subSectionName]
                    : configuration[section][subSectionName];
                labels[language] = textType ? element[textType] : element;
            }

            return labels;
        }, {});
    }
}
