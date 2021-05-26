import { I18nString } from '../../model';
import { LanguageConfiguration } from '../model/language-configuration';


/**
 * @author Daniel de Oliveira
 * @author Thomas Kleinke
 * @author Sebastian Cuy
 */
export function applyLanguageConfigurations(
        languageConfigurations: { [language: string]: Array<LanguageConfiguration> }) {

    return (configuration: [any, any]) => {

        const [categories, relations] = configuration;

        if (categories) {
            applyFields(languageConfigurations, categories);
            applyCategories(languageConfigurations, categories);
        }
        if (relations) applyRelations(languageConfigurations, relations);

        return [categories, relations];
    };
}


function applyFields(languageConfigurations: { [language: string]: Array<LanguageConfiguration> },
        categories: any) {

    for (const categoryName of Object.keys(categories)) {
        const category = categories[categoryName];

        for (const fieldName of Object.keys(category.fields)) {
            category.fields[fieldName].label = 
                LanguageConfiguration.getI18nString(languageConfigurations, 'fields', fieldName, 'label');
            category.fields[fieldName].description = 
                LanguageConfiguration.getI18nString(languageConfigurations, 'fields', fieldName, 'description');
        }
    }
}


function applyRelations(languageConfigurations: { [language: string]: Array<LanguageConfiguration> },
        relations: any) {

    for (const relation of relations) {
        relation.label = LanguageConfiguration.getI18nString(languageConfigurations, 'relations', relation.name, 'label');
    }
}


function applyCategories(languageConfigurations: { [language: string]: Array<LanguageConfiguration> },
        categories: any) {

    for (const categoryName of Object.keys(categories)) {
        const category = categories[categoryName];
        category.label = LanguageConfiguration.getI18nString(languageConfigurations, 'categories', categoryName, 'label');

        for (const fieldName of Object.keys(category.fields)) {
            const field = category.fields[fieldName];

            field.label = I18nString.mergeI18nStrings(field.label, LanguageConfiguration.getI18nString(
                languageConfigurations, 'commons', fieldName, 'label'
            ));
            field.label = I18nString.mergeI18nStrings(field.label, LanguageConfiguration.getI18nString(
                languageConfigurations, 'categoriesFields', fieldName, 'label', categoryName
            ));
            field.description = I18nString.mergeI18nStrings(field.description, LanguageConfiguration.getI18nString(
                languageConfigurations, 'commons', fieldName, 'description'
            ));
            field.description = I18nString.mergeI18nStrings(field.description, LanguageConfiguration.getI18nString(
                languageConfigurations, 'categoriesFields', fieldName, 'description', categoryName
            ));
        }
    }
}
