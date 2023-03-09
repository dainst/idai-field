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

    applyLanguagesToFormOrCategory(languageConfigurations, categoryDefinition, 'categories', categoryDefinition.name);
    applyLanguagesToCategoryFields(languageConfigurations, categoryDefinition.fields, categoryDefinition.name,
        categoryDefinition.parent);
}


export function applyLanguagesToForm(languageConfigurations: LanguageConfigurations,
                                     formDefinition: TransientFormDefinition,
                                     parentCategoryName?: string, parentFormName?: string) {

    applyLanguagesToFormOrCategory(languageConfigurations, formDefinition, 'categories', formDefinition.categoryName);
    applyLanguagesToFormOrCategory(languageConfigurations, formDefinition, 'forms', formDefinition.name);
    applyLanguagesToCategoryFields(languageConfigurations, formDefinition.fields, formDefinition.categoryName,
        parentCategoryName);
    applyLanguagesToFormFields(languageConfigurations, formDefinition.fields, formDefinition.name, parentFormName);
}


export function applyLanguagesToFields(languageConfigurations: LanguageConfigurations,
                                       fields: Map<TransientFieldDefinition>,
                                       section: 'fields'|'commons') {

    for (const fieldName of Object.keys(fields)) {
        const field = fields[fieldName];

        field.label = I18N.mergeI18nStrings(field.label, LanguageConfiguration.getI18nString(
            languageConfigurations.complete, section, fieldName, false, 'label'
        ));
        field.description = I18N.mergeI18nStrings(field.description, LanguageConfiguration.getI18nString(
            languageConfigurations.complete, section, fieldName, false, 'description'
        ));
        field.defaultLabel = I18N.mergeI18nStrings(field.defaultLabel, LanguageConfiguration.getI18nString(
            languageConfigurations.default, section, fieldName, false, 'label'
        ));
        field.defaultDescription = I18N.mergeI18nStrings(field.defaultDescription, LanguageConfiguration.getI18nString(
            languageConfigurations.default, section, fieldName, false, 'description'
        ));
    }
}


export function applyLanguagesToRelations(languageConfigurations: LanguageConfigurations, relations: Array<Relation>) {

    for (const relation of relations) {
        relation.label = LanguageConfiguration.getI18nString(
            languageConfigurations.complete, 'relations', relation.name, false, 'label'
        );
        relation.defaultLabel = LanguageConfiguration.getI18nString(
            languageConfigurations.default, 'relations', relation.name, false, 'label'
        );
        relation.description = LanguageConfiguration.getI18nString(
            languageConfigurations.complete, 'relations', relation.name, false, 'description'
        );
        relation.defaultDescription = LanguageConfiguration.getI18nString(
            languageConfigurations.default, 'relations', relation.name, false, 'description'
        );
    }
}


function applyLanguagesToCategoryFields(languageConfigurations: LanguageConfigurations,
                                        fields: Map<TransientFieldDefinition>, categoryName: string,
                                        parentCategoryName?: string) {

    applyLanguagesToFormOrCategoryFields(
        languageConfigurations, fields, categoryName, 'categories', parentCategoryName
    );                           
}


function applyLanguagesToFormFields(languageConfigurations: LanguageConfigurations,
                                    fields: Map<TransientFieldDefinition>, formName: string,
                                    parentFormName?: string) {

    applyLanguagesToFormOrCategoryFields(languageConfigurations, fields, formName, 'forms', parentFormName);
}


function applyLanguagesToFormOrCategory(languageConfigurations: LanguageConfigurations,
                                        definition: TransientFormDefinition|TransientCategoryDefinition,
                                        section: 'categories'|'forms', name: string) {

    definition.label = I18N.mergeI18nStrings(definition.label, LanguageConfiguration.getI18nString(
        languageConfigurations.complete, section, name, false, 'label'
    ));
    definition.defaultLabel = I18N.mergeI18nStrings(definition.defaultLabel, LanguageConfiguration.getI18nString(
        languageConfigurations.default, section, name, false, 'label'
    ));

    if (!definition.description) {
        definition.description = LanguageConfiguration.getI18nString(
            languageConfigurations.complete, section, name, false, 'description'
        );
        definition.defaultDescription = LanguageConfiguration.getI18nString(
            languageConfigurations.default, section, name, false, 'description'
        );
    }
}


function applyLanguagesToFormOrCategoryFields(languageConfigurations: LanguageConfigurations,
                                              fields: Map<TransientFieldDefinition>, name: string,
                                              section: 'categories'|'forms', parentName?: string) {

    for (const fieldName of Object.keys(fields)) {
        const field = fields[fieldName];

        field.label = I18N.mergeI18nStrings(field.label, LanguageConfiguration.getI18nString(
            languageConfigurations.complete, section, fieldName, true, 'label', name
        ));
        field.description = I18N.mergeI18nStrings(field.description, LanguageConfiguration.getI18nString(
            languageConfigurations.complete, section, fieldName, true, 'description', name
        ));
        field.defaultLabel = I18N.mergeI18nStrings(field.defaultLabel, LanguageConfiguration.getI18nString(
            languageConfigurations.default, section, fieldName, true, 'label', name
        ));
        field.defaultDescription = I18N.mergeI18nStrings(field.defaultDescription, LanguageConfiguration.getI18nString(
            languageConfigurations.default, section, fieldName, true, 'description', name
        ));

        if (parentName) {
            field.label = I18N.mergeI18nStrings(field.label, LanguageConfiguration.getI18nString(
                languageConfigurations.complete, section, fieldName, true, 'label', parentName
            ));  
            field.description = I18N.mergeI18nStrings(field.description, LanguageConfiguration.getI18nString(
                languageConfigurations.complete, section, fieldName, true, 'description', parentName
            ));
            field.defaultLabel = I18N.mergeI18nStrings(field.defaultLabel, LanguageConfiguration.getI18nString(
                languageConfigurations.default, section, fieldName, true, 'label', parentName
            ));
            field.defaultDescription = I18N.mergeI18nStrings(field.defaultDescription, LanguageConfiguration.getI18nString(
                languageConfigurations.default, section, fieldName, true, 'description', parentName
            ));
        }
    }
}