import { LanguageConfiguration } from '../configuration/model/language/language-configuration';
import { I18N } from '../tools/i18n';
import { InPlace } from '../tools/in-place';
import { CategoryForm } from './configuration/category-form';
import { Field, Subfield } from './configuration/field';
import { Group } from './configuration/group';

export type CustomLanguageConfigurations = { [language: string]: LanguageConfiguration };


/**
 * @author Thomas Kleinke
 */
export module CustomLanguageConfigurations {

    export function update(customLanguageConfigurations: CustomLanguageConfigurations,
                           editedLabel: I18N.String, editedDescription?: I18N.String,
                           category?: CategoryForm, field?: Field, subfield?: Subfield,
                           group?: Group) {

        updateSection(
            customLanguageConfigurations, 'label', editedLabel, category, field, subfield, group
        );

        if (!group && editedDescription) {
            updateSection(
                customLanguageConfigurations, 'description', editedDescription, category, field, subfield
            );
        }
    }


    export function deleteCategory(customLanguageConfigurations: CustomLanguageConfigurations,
                                   category: CategoryForm) {

        Object.keys(customLanguageConfigurations).forEach(languageKey => {
            InPlace.removeFrom(customLanguageConfigurations, [languageKey, 'categories', category.name]);
        });
    }


    export function hasCustomTranslations(customLanguageConfigurations: CustomLanguageConfigurations,
                                          category: CategoryForm): boolean {
        
        return Object.values(customLanguageConfigurations).find(languageConfiguration => {
            return languageConfiguration.categories?.[category.name];
        }) !== undefined;
    }


    function updateSection(customLanguageConfigurations: CustomLanguageConfigurations,
                           section: 'label'|'description', editedI18nString: I18N.String, category: CategoryForm,
                           field?: Field, subfield?: Subfield, group?: Group) {

        Object.keys(editedI18nString).forEach(languageCode => {
            handleNewTextInSection(
                customLanguageConfigurations, section, editedI18nString[languageCode], languageCode, category,
                field, subfield, group
            );
        });

        Object.keys(customLanguageConfigurations)
            .filter(languageCode => !editedI18nString[languageCode])
            .forEach(languageCode => {
                deleteFromSection(
                    customLanguageConfigurations, section, languageCode, category?.name, field, subfield, group?.name
                );
            });
    }


    function handleNewTextInSection(customLanguageConfigurations: CustomLanguageConfigurations,
                                    section: 'label'|'description', newText: string, languageCode: string,
                                    category: CategoryForm, field?: Field, subfield?: Subfield, group?: Group) {

        const definition = group ?? subfield ?? field ?? category;

        if (newText === definition[section === 'label' ? 'defaultLabel' : 'defaultDescription']?.[languageCode]) {
            deleteFromSection(
                customLanguageConfigurations, section, languageCode, category?.name, field, subfield, group?.name
            );
        } else {
            addToSection(
                customLanguageConfigurations, section, newText, languageCode, category?.name, field, subfield, group?.name
            );
        }
    }


    function deleteFromSection(customLanguageConfigurations: CustomLanguageConfigurations,
                               section: 'label'|'description', languageCode: string, categoryName?: string,
                               field?: Field, subfield?: Subfield, groupName?: string) {

        InPlace.removeFrom(
            customLanguageConfigurations,
            groupName
                ? [languageCode, 'groups', groupName]
                : field
                    ? field.inputType === Field.InputType.RELATION
                        ? [languageCode, 'relations', field.name, section]
                        : subfield
                            ? [languageCode, 'categories', categoryName, 'fields', field.name, 'subfields',
                                subfield.name, section]
                            : [languageCode, 'categories', categoryName, 'fields', field.name, section]
                    : [languageCode, 'categories', categoryName, section]
        );
    }


    function addToSection(customLanguageConfigurations: CustomLanguageConfigurations,
                          section: 'label'|'description', newText: string, languageCode: string,
                          categoryName: string, field?: Field, subfield?: Subfield, groupName?: string) {

        InPlace.setOn(
            customLanguageConfigurations,
            groupName
                ? [languageCode, 'groups', groupName]
                : field
                    ? field.inputType === Field.InputType.RELATION
                        ? [languageCode, 'relations', field.name, section]
                        : subfield
                            ? [languageCode, 'categories', categoryName, 'fields', field.name, 'subfields',
                                subfield.name, section]
                            : [languageCode, 'categories', categoryName, 'fields', field.name, section]
                    : [languageCode, 'categories', categoryName, section]
        )(newText);
    }
}
