import { Map } from 'tsfun';
import { Relation } from '../../model/configuration/relation';
import { TransientCategoryDefinition } from '../model';
import { LanguageConfiguration } from '../model/language-configuration';
import { LanguageConfigurations } from '../model/language-configurations';
import { applyLanguagesToCategory } from './apply-languages-to-category';


/**
 * @author Daniel de Oliveira
 * @author Thomas Kleinke
 * @author Sebastian Cuy
 */
export function applyLanguageConfigurations(languageConfigurations: LanguageConfigurations) {

    return (configuration: [Map<TransientCategoryDefinition>, Array<Relation>]) => {

        const [categories, relations] = configuration;

        if (categories) {
            applyFields(languageConfigurations, categories);
            applyLanguagesToCategories(languageConfigurations, categories);
        }
        if (relations) applyRelations(languageConfigurations, relations);

        return [categories, relations];
    };
}


function applyFields(languageConfigurations: LanguageConfigurations,
                     categories: Map<TransientCategoryDefinition>) {

    for (const category of Object.values(categories)) {
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


function applyRelations(languageConfigurations: LanguageConfigurations,
                        relations: Array<Relation>) {

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


function applyLanguagesToCategories(languageConfigurations: LanguageConfigurations,
                                    categories: Map<TransientCategoryDefinition>) {

    for (const key of Object.keys(categories)) {
        
        const category = categories[key];
        applyLanguagesToCategory(languageConfigurations, category, category.categoryName ?? key);
    }
}
