import { flatten, isEmpty, to } from 'tsfun';
import { Category, CustomCategoryDefinition, Field, FieldResource, Resource,
    GroupDefinition, Group, Groups, Document, ConfigurationDocument, Named } from 'idai-field-core';
import { LanguageConfigurationUtil } from './language-configuration-util';


export const OVERRIDE_VISIBLE_FIELDS = [Resource.IDENTIFIER, FieldResource.SHORTDESCRIPTION, FieldResource.GEOMETRY];


/**
 * @author Thomas Kleinke
 */
export module ConfigurationUtil {

    export const isHidden = (customCategoryDefinition?: CustomCategoryDefinition,
                             parentCustomCategoryDefinition?: CustomCategoryDefinition) =>
            (field: Field): boolean => {

        return (customCategoryDefinition?.hidden ?? []).includes(field.name) ||
            (parentCustomCategoryDefinition?.hidden ?? []).includes(field.name);
    }


    export function isParentField(category: Category, field: Field): boolean {

        if (!category.parentCategory) return false;

        return flatten(category.parentCategory.groups.map(to('fields')))
            .map(Named.toName)
            .includes(field.name);
    }


    export function createGroupsConfiguration(category: Category,
                                              permanentlyHiddenFields: string[]): Array<GroupDefinition> {

        return category.groups
            .filter(group => group.name !== Groups.HIDDEN_CORE_FIELDS)
            .reduce((result, group) => {
                result.push({
                    name: group.name,
                    fields: group.fields
                        .filter(field => !permanentlyHiddenFields.includes(field.name))
                        .map(field => field.name)
                });
                return result;
            }, []);
    }


    export function deleteCategory(category: Category,
                                   customConfigurationDocument: ConfigurationDocument): ConfigurationDocument {

        const clonedConfigurationDocument = Document.clone(customConfigurationDocument);
        delete clonedConfigurationDocument.resource.categories[category.libraryId ?? category.name];

        LanguageConfigurationUtil.deleteCategoryFromCustomLanguageConfigurations(
            clonedConfigurationDocument.resource.languages, category
        );

        clonedConfigurationDocument.resource.order
            = clonedConfigurationDocument.resource.order.filter(categoryName => categoryName !== category.name);

        return clonedConfigurationDocument;
    }


    export function deleteGroup(category: Category, group: Group,
                                otherCategories: Array<Category>,
                                customConfigurationDocument: ConfigurationDocument): ConfigurationDocument {

        const clonedConfigurationDocument = Document.clone(customConfigurationDocument);
        const clonedCategoryConfiguration = clonedConfigurationDocument.resource
            .categories[category.libraryId ?? category.name];
        clonedCategoryConfiguration.groups = clonedCategoryConfiguration.groups.filter(g => g.name !== group.name);

        if (!otherCategories.find(category => category.groups.find(g => g.name === group.name))) {
            LanguageConfigurationUtil.updateCustomLanguageConfigurations(
                clonedConfigurationDocument.resource.languages, {}, {}, category, undefined, group
            );
        }

        return clonedConfigurationDocument;
    }


    export function deleteField(category: Category, field: Field,
                                customConfigurationDocument: ConfigurationDocument): ConfigurationDocument {

        const clonedConfigurationDocument = Document.clone(customConfigurationDocument);
        const clonedCategoryConfiguration = clonedConfigurationDocument.resource
            .categories[category.libraryId ?? category.name];
        delete clonedCategoryConfiguration.fields[field.name];

        const groupDefinition = clonedCategoryConfiguration.groups.find(
            group => group.fields.includes(field.name)
        );
        groupDefinition.fields = groupDefinition.fields.filter(f => f !== field.name);

        LanguageConfigurationUtil.updateCustomLanguageConfigurations(
            clonedConfigurationDocument.resource.languages, {}, {}, category, field
        );

        return clonedConfigurationDocument;
    }


    export function isEditableGroup(group: Group): boolean {

        return group.name !== Groups.PARENT && group.name !== Groups.CHILD;
    }


    export function isCustomizedCategory(configurationDocument: ConfigurationDocument,
                                         category: Category): boolean {

        const customDefinition: CustomCategoryDefinition = configurationDocument.resource
            .categories[category.libraryId ?? category.name];

        return customDefinition.color !== undefined
            || customDefinition.groups !== undefined
            || (customDefinition.valuelists !== undefined && !isEmpty(customDefinition.valuelists))
            || (customDefinition.fields !== undefined && !isEmpty(customDefinition.fields))
            || (customDefinition.commons !== undefined && !isEmpty(customDefinition.commons))
            || (customDefinition.hidden !== undefined && !isEmpty(customDefinition.hidden))
            || LanguageConfigurationUtil.hasCustomTranslations(
                configurationDocument.resource.languages, category
            );
    }
}
