import { I18nString } from '../../model';
import { LanguageConfiguration } from '../model/language-configuration';
import { LanguageConfigurations } from '../model/language-configurations';


/**
 * @author Daniel de Oliveira
 * @author Thomas Kleinke
 * @author Sebastian Cuy
 */
export function applyLanguageConfigurations(languageConfigurations: LanguageConfigurations) {

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


function applyFields(languageConfigurations: LanguageConfigurations, categories: any) {

    for (const categoryName of Object.keys(categories)) {
        const category = categories[categoryName];

        for (const fieldName of Object.keys(category.fields)) {
            category.fields[fieldName].label = LanguageConfiguration.getI18nString(
                languageConfigurations.complete,
                'fields', fieldName, 'label'
            );
            category.fields[fieldName].description = LanguageConfiguration.getI18nString(
                languageConfigurations.complete,
                'fields', fieldName, 'description'
            );
            category.fields[fieldName].defaultLabel = LanguageConfiguration.getI18nString(
                languageConfigurations.default,
                'fields', fieldName, 'label'
            );
            category.fields[fieldName].defaultDescription = LanguageConfiguration.getI18nString(
                languageConfigurations.default,
                'fields', fieldName, 'description'
            );
        }
    }
}


function applyRelations(languageConfigurations: LanguageConfigurations, relations: any) {

    for (const relation of relations) {
        relation.label = LanguageConfiguration.getI18nString(
            languageConfigurations.complete,
            'relations', relation.name, 'label'
        );
        relation.defaultLabel = LanguageConfiguration.getI18nString(
            languageConfigurations.default,
            'relations', relation.name, 'label'
        );
    }
}


function applyCategories(languageConfigurations: LanguageConfigurations, categories: any) {

    for (const categoryName of Object.keys(categories)) {
        const category = categories[categoryName];
        category.label = LanguageConfiguration.getI18nString(
            languageConfigurations.complete,
            'categories', categoryName, 'label'
        );
        category.defaultLabel = LanguageConfiguration.getI18nString(
            languageConfigurations.default,
            'categories', categoryName, 'label'
        );
        category.description = LanguageConfiguration.getI18nString(
            languageConfigurations.complete,
            'categories', categoryName, 'description'
        );
        category.defaultDescription = LanguageConfiguration.getI18nString(
            languageConfigurations.default,
            'categories', categoryName, 'description'
        );

        for (const fieldName of Object.keys(category.fields)) {
            const field = category.fields[fieldName];

            field.label = I18nString.mergeI18nStrings(field.label, LanguageConfiguration.getI18nString(
                languageConfigurations.complete, 'commons', fieldName, 'label'
            ));
            field.label = I18nString.mergeI18nStrings(field.label, LanguageConfiguration.getI18nString(
                languageConfigurations.complete, 'categoriesFields', fieldName, 'label', categoryName
            ));
            field.description = I18nString.mergeI18nStrings(field.description, LanguageConfiguration.getI18nString(
                languageConfigurations.complete, 'commons', fieldName, 'description'
            ));
            field.description = I18nString.mergeI18nStrings(field.description, LanguageConfiguration.getI18nString(
                languageConfigurations.complete, 'categoriesFields', fieldName, 'description', categoryName
            ));
            field.defaultLabel = I18nString.mergeI18nStrings(field.defaultLabel, LanguageConfiguration.getI18nString(
                languageConfigurations.default, 'commons', fieldName, 'label'
            ));
            field.defaultLabel = I18nString.mergeI18nStrings(field.defaultLabel, LanguageConfiguration.getI18nString(
                languageConfigurations.default, 'categoriesFields', fieldName, 'label', categoryName
            ));
            field.defaultDescription = I18nString.mergeI18nStrings(field.defaultDescription, LanguageConfiguration.getI18nString(
                languageConfigurations.default, 'commons', fieldName, 'description'
            ));
            field.defaultDescription = I18nString.mergeI18nStrings(field.defaultDescription, LanguageConfiguration.getI18nString(
                languageConfigurations.default, 'categoriesFields', fieldName, 'description', categoryName
            ));
        }
    }
}
