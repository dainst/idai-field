import { Map } from 'tsfun';
import { Relation } from '../../model/configuration/relation';
import { TransientCategoryDefinition } from '../model/category/transient-category-definition';
import { TransientFormDefinition } from '../model/form/transient-form-definition';
import { LanguageConfiguration } from '../model/language/language-configuration';
import { LanguageConfigurations } from '../model/language/language-configurations';
import { applyLanguagesToForm } from './apply-languages-to-form';


/**
 * @author Daniel de Oliveira
 * @author Thomas Kleinke
 * @author Sebastian Cuy
 */
export function applyLanguageConfigurations(languageConfigurations: LanguageConfigurations,
                                            categories: Map<TransientCategoryDefinition>) {

    return ([forms, relations]: [Map<TransientFormDefinition>, Array<Relation>]) => {

        if (forms) {
            applyFields(languageConfigurations, forms);
            applyLanguagesToForms(languageConfigurations, forms, categories);
        }
        if (relations) applyRelations(languageConfigurations, relations);

        return [forms, relations];
    };
}


function applyFields(languageConfigurations: LanguageConfigurations, forms: Map<TransientFormDefinition>) {

    for (const form of Object.values(forms)) {
        for (const fieldName of Object.keys(form.fields)) {
            form.fields[fieldName].label = LanguageConfiguration.getI18nString(
                languageConfigurations.complete,
                'fields', fieldName, 'label'
            );
            form.fields[fieldName].description = LanguageConfiguration.getI18nString(
                languageConfigurations.complete,
                'fields', fieldName, 'description'
            );
            form.fields[fieldName].defaultLabel = LanguageConfiguration.getI18nString(
                languageConfigurations.default,
                'fields', fieldName, 'label'
            );
            form.fields[fieldName].defaultDescription = LanguageConfiguration.getI18nString(
                languageConfigurations.default,
                'fields', fieldName, 'description'
            );
        }
    }
}


function applyRelations(languageConfigurations: LanguageConfigurations, relations: Array<Relation>) {

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


function applyLanguagesToForms(languageConfigurations: LanguageConfigurations,
                               forms: Map<TransientFormDefinition>,
                               categories: Map<TransientCategoryDefinition>) {

    for (const form of Object.values(forms)) {
        const parentCategoryName: string|undefined = form.parent ?? categories[form.categoryName].parent;
        applyLanguagesToForm(languageConfigurations, form, parentCategoryName);
    }
}
