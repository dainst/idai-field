import { isEmpty } from 'tsfun';
import { Category, FieldDefinition, I18nString, LanguageConfiguration } from 'idai-field-core';


export type CustomLanguageConfigurations = { [language: string]: LanguageConfiguration };


/**
 * @author Thomas Kleinke
 */
export module LanguageConfigurationUtil {

    export function updateCustomLanguageConfigurations(customLanguageConfigurations: CustomLanguageConfigurations,
                                                       editedLabel: I18nString, editedDescription: I18nString,
                                                       category: Category, field: FieldDefinition) {

        updateCustomLanguageConfigurationSection(
            customLanguageConfigurations, 'label', editedLabel, category, field
        );
        updateCustomLanguageConfigurationSection(
            customLanguageConfigurations, 'description', editedDescription, category, field
        );
    }


    function updateCustomLanguageConfigurationSection(customLanguageConfigurations: CustomLanguageConfigurations,
                                                      section: 'label'|'description', editedI18nString: I18nString,
                                                      category: Category, field: FieldDefinition) {

        Object.keys(editedI18nString).forEach(languageCode => {
            handleNewTextInCustomLanguageConfigurationSection(
                customLanguageConfigurations, section, editedI18nString[languageCode], languageCode, category, field
            );
        });

        Object.keys(customLanguageConfigurations)
            .filter(languageCode => !editedI18nString[languageCode])
            .forEach(languageCode => {
                deleteFromCustomLanguageConfigurationSection(
                    customLanguageConfigurations, section, languageCode, category.name, field.name
                );
            });
    }


    function handleNewTextInCustomLanguageConfigurationSection(customLanguageConfigurations: CustomLanguageConfigurations,
                                                               section: 'label'|'description', newText: string,
                                                               languageCode: string, category: Category,
                                                               field: FieldDefinition) {

        if (newText === field[section === 'label' ? 'defaultLabel' : 'defaultDescription']?.[languageCode]) {
            deleteFromCustomLanguageConfigurationSection(
                customLanguageConfigurations, section, languageCode, category.name, field.name
            );
        } else {
            addToCustomLanguageConfigurationSection(
                customLanguageConfigurations, section, newText, languageCode, category.name, field.name
            );
        }
    }


    function deleteFromCustomLanguageConfigurationSection(customLanguageConfigurations: CustomLanguageConfigurations,
                                                          section: 'label'|'description', languageCode: string,
                                                          categoryName: string, fieldName: string) {

        if (!customLanguageConfigurations[languageCode]) return;
        const languageConfiguration = customLanguageConfigurations[languageCode];

        if (!languageConfiguration.categories) return;
        if (!languageConfiguration.categories[categoryName]) return;
        const categoryConfiguration = languageConfiguration.categories[categoryName];
        
        if (!categoryConfiguration.fields) return;
        if (!categoryConfiguration.fields[fieldName]) return;
        const fieldConfiguration = categoryConfiguration.fields[fieldName];

        delete fieldConfiguration[section];

        if (isEmpty(fieldConfiguration)) delete categoryConfiguration.fields[fieldName];
        if (isEmpty(categoryConfiguration.fields)) delete categoryConfiguration.fields;
        if (isEmpty(categoryConfiguration)) delete languageConfiguration.categories[categoryName];
        if (isEmpty(languageConfiguration.categories)) delete languageConfiguration.categories;
        if (isEmpty(languageConfiguration)) delete customLanguageConfigurations[languageCode];
    }



    function addToCustomLanguageConfigurationSection(customLanguageConfigurations: CustomLanguageConfigurations,
                                                     section: 'label'|'description', newText: string,
                                                     languageCode: string, categoryName: string,
                                                     fieldName: string) {

        if (!customLanguageConfigurations[languageCode]) {
            customLanguageConfigurations[languageCode] = {};
        }
        const languageConfiguration = customLanguageConfigurations[languageCode];
        
        if (!languageConfiguration.categories) languageConfiguration.categories = {};
        if (!languageConfiguration.categories[categoryName]) {
            languageConfiguration.categories[categoryName] = {};
        }
        const categoryConfiguration = languageConfiguration.categories[categoryName];

        if (!categoryConfiguration.fields) categoryConfiguration.fields = {};
        if (!categoryConfiguration.fields[fieldName]) {
            categoryConfiguration.fields[fieldName] = {};
        }
        const fieldConfiguration = categoryConfiguration.fields[fieldName];
        
        fieldConfiguration[section] = newText;
    }
}
