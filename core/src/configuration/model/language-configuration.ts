import { I18N } from '../../tools/i18n';


export interface LanguageConfiguration {

    categories?: { [categoryName: string]: CategoryLanguageDefinition };
    relations?: { [relationName: string]: RelationLanguageDefinition };
    groups?: { [groupName: string]: string };
    commons?: { [fieldName: string]: FieldLanguageDefinition };
    fields?: { [fieldName: string]: FieldLanguageDefinition };
}


export interface CategoryLanguageDefinition {

    label?: string;
    description?: string;
    fields?: { [fieldName: string]: FieldLanguageDefinition };
}


export interface FieldLanguageDefinition {

    label?: string;
    description?: string;
}


export interface RelationLanguageDefinition {

    label?: string;
}


/**
 * @author Thomas Kleinke
 */
export module LanguageConfiguration {

    export function getI18nString(languageConfigurations: { [language: string]: Array<LanguageConfiguration> },
                                  section: 'categories'|'categoriesFields'|'relations'|'groups'|'commons'
                                 |'fields'|'other', subSectionName: string, textType?: 'label'|'description', categoryName?: string): I18N.String {

        return Object.keys(languageConfigurations).reduce((labels, language) => {

            const configuration = languageConfigurations[language].find(config => {
                const fieldConfiguration = section === 'categoriesFields'
                    ? config.categories?.[categoryName]?.fields?.[subSectionName]
                    : config[section]?.[subSectionName];
                return fieldConfiguration && (!textType || fieldConfiguration[textType]);
            });

            if (configuration) {
                 const element = section === 'categoriesFields'
                    ? configuration.categories[categoryName].fields[subSectionName]
                    : configuration[section][subSectionName];
                labels[language] = textType ? element[textType] : element;
            }

            return labels;
        }, {});
    }
}
