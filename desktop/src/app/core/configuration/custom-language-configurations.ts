import { Category, Field, Group, I18N, InPlace, LanguageConfiguration } from 'idai-field-core';


export type CustomLanguageConfigurations = { [language: string]: LanguageConfiguration };


/**
 * @author Thomas Kleinke
 */
export module CustomLanguageConfigurations {

    export function updateCustomLanguageConfigurations(customLanguageConfigurations: CustomLanguageConfigurations,
                                                       editedLabel: I18N.String, editedDescription?: I18N.String,
                                                       category?: Category, field?: Field,
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


    export function deleteCategoryFromCustomLanguageConfigurations(
            customLanguageConfigurations: CustomLanguageConfigurations, category: Category) {

        Object.keys(customLanguageConfigurations).forEach(languageKey => {
            InPlace.removeFrom(customLanguageConfigurations, [languageKey, 'categories', category.name]);
        });
    }


    export function hasCustomTranslations(customLanguageConfigurations: CustomLanguageConfigurations,
                                          category: Category): boolean {
        
        return Object.values(customLanguageConfigurations).find(languageConfiguration => {
            return languageConfiguration.categories?.[category.name];
        }) !== undefined;
    }


    function updateCustomLanguageConfigurationSection(customLanguageConfigurations: CustomLanguageConfigurations,
                                                      section: 'label'|'description', editedI18nString: I18N.String,
                                                      category: Category, field?: Field, group?: Group) {

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
                                                               field?: Field, group?: Group) {

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

        InPlace.removeFrom(
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

        InPlace.setOn(
            customLanguageConfigurations,
            groupName
                ? [languageCode, 'groups', groupName]
                : fieldName
                    ? [languageCode, 'categories', categoryName, 'fields', fieldName, section]
                    : [languageCode, 'categories', categoryName, section]
        )(newText);
    }
}
