import { Category, FieldDefinition, Group, I18nString, Inplace, LanguageConfiguration } from 'idai-field-core';


export type CustomLanguageConfigurations = { [language: string]: LanguageConfiguration };


/**
 * @author Thomas Kleinke
 */
export module LanguageConfigurationUtil {

    export function updateCustomLanguageConfigurations(customLanguageConfigurations: CustomLanguageConfigurations,
                                                       editedLabel: I18nString, editedDescription?: I18nString,
                                                       category?: Category, field?: FieldDefinition,
                                                       group?: Group) {

        updateCustomLanguageConfigurationSection(
            customLanguageConfigurations, 'label', editedLabel, category, field, group
        );

        if (!group && editedDescription) {
            updateCustomLanguageConfigurationSection(
                customLanguageConfigurations, 'description', editedDescription, category, field
            );
        }
    }


    function updateCustomLanguageConfigurationSection(customLanguageConfigurations: CustomLanguageConfigurations,
                                                      section: 'label'|'description', editedI18nString: I18nString,
                                                      category: Category, field?: FieldDefinition, group?: Group) {

        Object.keys(editedI18nString).forEach(languageCode => {
            handleNewTextInCustomLanguageConfigurationSection(
                customLanguageConfigurations, section, editedI18nString[languageCode], languageCode, category,
                field, group
            );
        });

        Object.keys(customLanguageConfigurations)
            .filter(languageCode => !editedI18nString[languageCode])
            .forEach(languageCode => {
                deleteFromCustomLanguageConfigurationSection(
                    customLanguageConfigurations, section, languageCode, category?.name, field?.name, group?.name
                );
            });
    }


    function handleNewTextInCustomLanguageConfigurationSection(customLanguageConfigurations: CustomLanguageConfigurations,
                                                               section: 'label'|'description', newText: string,
                                                               languageCode: string, category: Category,
                                                               field?: FieldDefinition, group?: Group) {

        const definition = group ?? field ?? category;

        if (newText === definition[section === 'label' ? 'defaultLabel' : 'defaultDescription']?.[languageCode]) {
            deleteFromCustomLanguageConfigurationSection(
                customLanguageConfigurations, section, languageCode, category?.name, field?.name, group?.name
            );
        } else {
            addToCustomLanguageConfigurationSection(
                customLanguageConfigurations, section, newText, languageCode, category?.name, field?.name, group?.name
            );
        }
    }


    function deleteFromCustomLanguageConfigurationSection(customLanguageConfigurations: CustomLanguageConfigurations,
                                                          section: 'label'|'description', languageCode: string,
                                                          categoryName?: string, fieldName?: string,
                                                          groupName?: string) {

        Inplace.removeFrom(
            customLanguageConfigurations,
            groupName
                ? [languageCode, 'groups', groupName]
                : fieldName
                    ? [languageCode, 'categories', categoryName, 'fields', fieldName, section]
                    : [languageCode, 'categories', categoryName, section]
        );
    }


    function addToCustomLanguageConfigurationSection(customLanguageConfigurations: CustomLanguageConfigurations,
                                                     section: 'label'|'description', newText: string,
                                                     languageCode: string, categoryName: string,
                                                     fieldName?: string, groupName?: string) {

        Inplace.setOn(
            customLanguageConfigurations,
            groupName
                ? [languageCode, 'groups', groupName]
                : fieldName
                    ? [languageCode, 'categories', categoryName, 'fields', fieldName, section]
                    : [languageCode, 'categories', categoryName, section]
        )(newText);
    }
}
