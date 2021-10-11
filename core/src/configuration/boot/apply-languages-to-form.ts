import { I18N } from '../../tools/i18n';
import { TransientFormDefinition } from '../model/form/transient-form-definition';
import { LanguageConfiguration } from '../model/language/language-configuration';
import { LanguageConfigurations } from '../model/language/language-configurations';


export function applyLanguagesToForm(languageConfigurations: LanguageConfigurations,
                                     form: TransientFormDefinition, parentCategoryName?: string) {

    form.label = LanguageConfiguration.getI18nString(
        languageConfigurations.complete,
        'categories', form.categoryName, 'label'
    );
    form.defaultLabel = LanguageConfiguration.getI18nString(
        languageConfigurations.default,
        'categories', form.categoryName, 'label'
    );

    if (!form.description) {
        form.description = LanguageConfiguration.getI18nString(
            languageConfigurations.complete,
            'categories', form.categoryName, 'description'
        );
        form.defaultDescription = LanguageConfiguration.getI18nString(
            languageConfigurations.default,
            'categories', form.categoryName, 'description'
        );
    }

    for (const fieldName of Object.keys(form.fields)) {
        const field = form.fields[fieldName];

        field.label = I18N.mergeI18nStrings(field.label, LanguageConfiguration.getI18nString(
            languageConfigurations.complete, 'commons', fieldName, 'label'
        ));
        field.label = I18N.mergeI18nStrings(field.label, LanguageConfiguration.getI18nString(
            languageConfigurations.complete, 'categoriesFields', fieldName, 'label', form.categoryName
        ));
        field.description = I18N.mergeI18nStrings(field.description, LanguageConfiguration.getI18nString(
            languageConfigurations.complete, 'commons', fieldName, 'description'
        ));
        field.description = I18N.mergeI18nStrings(field.description, LanguageConfiguration.getI18nString(
            languageConfigurations.complete, 'categoriesFields', fieldName, 'description', form.categoryName
        ));
        field.defaultLabel = I18N.mergeI18nStrings(field.defaultLabel, LanguageConfiguration.getI18nString(
            languageConfigurations.default, 'commons', fieldName, 'label'
        ));
        field.defaultLabel = I18N.mergeI18nStrings(field.defaultLabel, LanguageConfiguration.getI18nString(
            languageConfigurations.default, 'categoriesFields', fieldName, 'label', form.categoryName
        ));
        field.defaultDescription = I18N.mergeI18nStrings(field.defaultDescription, LanguageConfiguration.getI18nString(
            languageConfigurations.default, 'commons', fieldName, 'description'
        ));
        field.defaultDescription = I18N.mergeI18nStrings(field.defaultDescription, LanguageConfiguration.getI18nString(
            languageConfigurations.default, 'categoriesFields', fieldName, 'description', form.categoryName
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