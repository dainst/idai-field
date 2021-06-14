import { clone, set } from 'tsfun';
import { Category, FieldDefinition, I18nString, Inplace, LanguageConfiguration } from 'idai-field-core';


export type CustomLanguageConfigurations = { [language: string]: LanguageConfiguration };


/**
 * @author Thomas Kleinke
 */
export module LanguageConfigurationUtil {

    export function updateCustomLanguageConfigurations(customLanguageConfigurations: CustomLanguageConfigurations,
                                                       editedLabel: I18nString, editedDescription: I18nString,
                                                       category: Category, field?: FieldDefinition) {

        updateCustomLanguageConfigurationSection(
            customLanguageConfigurations, 'label', editedLabel, category, field
        );
        updateCustomLanguageConfigurationSection(
            customLanguageConfigurations, 'description', editedDescription, category, field
        );
    }


    export function mergeCustomAndDefaultTranslations(customLanguageConfigurations: CustomLanguageConfigurations,
                                                      type: 'label'|'description',
                                                      category: Category, field?: FieldDefinition): I18nString {

        const definition = field ?? category;
        const defaultType = type === 'label' ? 'defaultLabel' : 'defaultDescription';

        return Object.keys(customLanguageConfigurations).reduce((result: I18nString, languageCode: string) => {
            const translation = getFromCustomLanguageConfiguration(
                customLanguageConfigurations, languageCode, type, category, field
            );
            if (translation) result[languageCode] = translation;
            return result;
        }, definition[defaultType] ? clone(definition[defaultType]) : {});
    }


    export function getUpdatedDefinition(customLanguageConfigurations: CustomLanguageConfigurations,
                                         category: Category, field?: FieldDefinition): FieldDefinition|Category {
        
        const definition = field ?? category;
        const clonedDefinition = field ? clone(field) : cloneCategory(category);

        const languages: string[] = set(
            Object.keys(customLanguageConfigurations)
             .concat(Object.keys(definition.label))
             .concat(Object.keys(definition.description))
        );

        return languages.reduce((result, languageCode) => {
            const label: string|undefined = getFromCustomLanguageConfiguration(
                customLanguageConfigurations, languageCode, 'label', category, field
            );
            const description: string|undefined = getFromCustomLanguageConfiguration(
                customLanguageConfigurations, languageCode, 'description', category, field
            );
            result.label[languageCode] = label ?? result.defaultLabel[languageCode];
            result.description[languageCode] = description ?? result.defaultDescription[languageCode];
            return result;
        }, clonedDefinition);
    }


    function cloneCategory(category: Category): Category {

        const children = category.children;
        const parentCategory = category.parentCategory;

        delete category.children;
        delete category.parentCategory;

        const clonedCategory = clone(category);

        category.children = children;
        category.parentCategory = parentCategory;

        return clonedCategory;
    }


    function getFromCustomLanguageConfiguration(customLanguageConfigurations: CustomLanguageConfigurations,
                                                languageCode: string, section: 'label'|'description',
                                                category: Category, field?: FieldDefinition): string|undefined {

        return field
            ? customLanguageConfigurations[languageCode]
                ?.categories?.[category.name]
                ?.fields?.[field.name]
                ?.[section]
            : customLanguageConfigurations[languageCode]
                ?.categories?.[category.name]
                ?.[section];
    }


    function updateCustomLanguageConfigurationSection(customLanguageConfigurations: CustomLanguageConfigurations,
                                                      section: 'label'|'description', editedI18nString: I18nString,
                                                      category: Category, field?: FieldDefinition) {

        Object.keys(editedI18nString).forEach(languageCode => {
            handleNewTextInCustomLanguageConfigurationSection(
                customLanguageConfigurations, section, editedI18nString[languageCode], languageCode, category, field
            );
        });

        Object.keys(customLanguageConfigurations)
            .filter(languageCode => !editedI18nString[languageCode])
            .forEach(languageCode => {
                deleteFromCustomLanguageConfigurationSection(
                    customLanguageConfigurations, section, languageCode, category.name, field?.name
                );
            });
    }


    function handleNewTextInCustomLanguageConfigurationSection(customLanguageConfigurations: CustomLanguageConfigurations,
                                                               section: 'label'|'description', newText: string,
                                                               languageCode: string, category: Category,
                                                               field?: FieldDefinition) {

        const definition = field ?? category;

        if (newText === definition[section === 'label' ? 'defaultLabel' : 'defaultDescription']?.[languageCode]) {
            deleteFromCustomLanguageConfigurationSection(
                customLanguageConfigurations, section, languageCode, category.name, field?.name
            );
        } else {
            addToCustomLanguageConfigurationSection(
                customLanguageConfigurations, section, newText, languageCode, category.name, field?.name
            );
        }
    }


    function deleteFromCustomLanguageConfigurationSection(customLanguageConfigurations: CustomLanguageConfigurations,
                                                          section: 'label'|'description', languageCode: string,
                                                          categoryName: string, fieldName?: string) {

        Inplace.removeFrom(
            customLanguageConfigurations,
            fieldName
                ? [languageCode, 'categories', categoryName, 'fields', fieldName, section]
                : [languageCode, 'categories', categoryName, section]
        );
    }


    function addToCustomLanguageConfigurationSection(customLanguageConfigurations: CustomLanguageConfigurations,
                                                     section: 'label'|'description', newText: string,
                                                     languageCode: string, categoryName: string,
                                                     fieldName?: string) {

        Inplace.setOn(
            customLanguageConfigurations,
            fieldName
                ? [languageCode, 'categories', categoryName, 'fields', fieldName, section]
                : [languageCode, 'categories', categoryName, section]
        )(newText);
    }
}
