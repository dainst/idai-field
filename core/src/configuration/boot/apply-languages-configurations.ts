import { Map } from 'tsfun';
import { TransientFormDefinition } from '..';
import { Relation } from '../../model/configuration/relation';
import { I18N } from '../../tools/i18n';
import { TransientCategoryDefinition } from '../model/category/transient-category-definition';
import { TransientFieldDefinition } from '../model/field/transient-field-definition';
import { LanguageConfiguration } from '../model/language/language-configuration';
import { LanguageConfigurations } from '../model/language/language-configurations';


export function applyLanguagesToCategory(languageConfigurations: LanguageConfigurations,
                                         categoryDefinition: TransientCategoryDefinition) {

    applyLanguagesToFormOrCategory(languageConfigurations, categoryDefinition, categoryDefinition.name);
    applyLanguagesToFormOrCategoryFields(languageConfigurations, categoryDefinition.fields, categoryDefinition.name,
        categoryDefinition.parent);
}


export function applyLanguagesToForm(languageConfigurations: LanguageConfigurations,
                                     formDefinition: TransientFormDefinition,
                                     parentCategoryName?: string) {

    applyLanguagesToFormOrCategory(languageConfigurations, formDefinition, formDefinition.categoryName);
    applyLanguagesToFormOrCategoryFields(languageConfigurations, formDefinition.fields, formDefinition.categoryName,
        parentCategoryName);
}


export function applyLanguagesToFields(languageConfigurations: LanguageConfigurations,
                                       fields: Map<TransientFieldDefinition>,
                                       section: 'fields'|'commons') {

    for (const fieldName of Object.keys(fields)) {
        const field = fields[fieldName];

        field.label = I18N.mergeI18nStrings(field.label, LanguageConfiguration.getI18nString(
            languageConfigurations.complete, section, fieldName, 'label'
        ));
        field.description = I18N.mergeI18nStrings(field.description, LanguageConfiguration.getI18nString(
            languageConfigurations.complete, section, fieldName, 'description'
        ));
        field.defaultLabel = I18N.mergeI18nStrings(field.defaultLabel, LanguageConfiguration.getI18nString(
            languageConfigurations.default, section, fieldName, 'label'
        ));
        field.defaultDescription = I18N.mergeI18nStrings(field.defaultDescription, LanguageConfiguration.getI18nString(
            languageConfigurations.default, section, fieldName, 'description'
        ));
    }
}


export function applyLanguagesToRelations(languageConfigurations: LanguageConfigurations, relations: Array<Relation>) {

    for (const relation of relations) {
        relation.label = LanguageConfiguration.getI18nString(
            languageConfigurations.complete, 'relations', relation.name, 'label'
        );
        relation.defaultLabel = LanguageConfiguration.getI18nString(
            languageConfigurations.default, 'relations', relation.name, 'label'
        );
        relation.description = LanguageConfiguration.getI18nString(
            languageConfigurations.complete, 'relations', relation.name, 'description'
        );
        relation.defaultDescription = LanguageConfiguration.getI18nString(
            languageConfigurations.default, 'relations', relation.name, 'description'
        );
    }
}


function applyLanguagesToFormOrCategory(languageConfigurations: LanguageConfigurations,
                                        definition: TransientFormDefinition|TransientCategoryDefinition,
                                        categoryName: string) {

    definition.label = LanguageConfiguration.getI18nString(
        languageConfigurations.complete,
        'categories', categoryName, 'label'
    );
    definition.defaultLabel = LanguageConfiguration.getI18nString(
        languageConfigurations.default,
        'categories', categoryName, 'label'
    );

    if (!definition.description) {
        definition.description = LanguageConfiguration.getI18nString(
            languageConfigurations.complete,
            'categories', categoryName, 'description'
        );
        definition.defaultDescription = LanguageConfiguration.getI18nString(
            languageConfigurations.default,
            'categories', categoryName, 'description'
        );
    }
}


function applyLanguagesToFormOrCategoryFields(languageConfigurations: LanguageConfigurations,
                                              fields: Map<TransientFieldDefinition>, categoryName: string,
                                              parentCategoryName?: string) {

    for (const fieldName of Object.keys(fields)) {
        const field = fields[fieldName];

        field.label = I18N.mergeI18nStrings(field.label, LanguageConfiguration.getI18nString(
            languageConfigurations.complete, 'categoriesFields', fieldName, 'label', categoryName
        ));
        field.description = I18N.mergeI18nStrings(field.description, LanguageConfiguration.getI18nString(
            languageConfigurations.complete, 'categoriesFields', fieldName, 'description', categoryName
        ));
        field.defaultLabel = I18N.mergeI18nStrings(field.defaultLabel, LanguageConfiguration.getI18nString(
            languageConfigurations.default, 'categoriesFields', fieldName, 'label', categoryName
        ));
        field.defaultDescription = I18N.mergeI18nStrings(field.defaultDescription, LanguageConfiguration.getI18nString(
            languageConfigurations.default, 'categoriesFields', fieldName, 'description', categoryName
        ));

        if (parentCategoryName) {
            field.label = I18N.mergeI18nStrings(field.label, LanguageConfiguration.getI18nString(
                languageConfigurations.complete, 'categoriesFields', fieldName, 'label', parentCategoryName
            ));  
            field.description = I18N.mergeI18nStrings(field.description, LanguageConfiguration.getI18nString(
                languageConfigurations.complete, 'categoriesFields', fieldName, 'description', parentCategoryName
            ));
            field.defaultLabel = I18N.mergeI18nStrings(field.defaultLabel, LanguageConfiguration.getI18nString(
                languageConfigurations.default, 'categoriesFields', fieldName, 'label', parentCategoryName
            ));
            field.defaultDescription = I18N.mergeI18nStrings(field.defaultDescription, LanguageConfiguration.getI18nString(
                languageConfigurations.default, 'categoriesFields', fieldName, 'description', parentCategoryName
            ));
        }
    }
}