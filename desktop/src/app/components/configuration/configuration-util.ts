import { clone, flatten, isEmpty, to } from 'tsfun';
import { CategoryForm, Field, FieldResource, Resource,
    GroupDefinition, Group, Groups, Document, ConfigurationDocument, Named, CustomFormDefinition } from 'idai-field-core';
import { CustomLanguageConfigurations } from './custom-language-configurations';


export const OVERRIDE_VISIBLE_FIELDS = [Resource.IDENTIFIER, FieldResource.SHORTDESCRIPTION, FieldResource.GEOMETRY];


/**
 * @author Thomas Kleinke
 */
export module ConfigurationUtil {

    export const isHidden = (customFormDefinition?: CustomFormDefinition,
                             parentCustomFormDefinitiion?: CustomFormDefinition) =>
            (field: Field): boolean => {

        return (customFormDefinition?.hidden ?? []).includes(field.name) ||
            (parentCustomFormDefinitiion?.hidden ?? []).includes(field.name);
    }


    export function isParentField(category: CategoryForm, field: Field): boolean {

        if (!category.parentCategory) return false;

        return flatten(category.parentCategory.groups.map(to('fields')))
            .map(Named.toName)
            .includes(field.name);
    }


    export function createGroupsConfiguration(category: CategoryForm,
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


    export function getCategoriesOrder(topLevelCategoriesArray: Array<CategoryForm>): string[] {

        return topLevelCategoriesArray.reduce((order, category) => {
            order.push(category.name);
            if (category.children) order = order.concat(category.children.map(to(Named.NAME)));
            return order;
        }, []);
    }


    export function addToCategoriesOrder(categoriesOrder: string[], newCategoryName: string,
                                         parentCategoryName?: string): string[] {

        const newOrder: string[] = clone(categoriesOrder);

        if (parentCategoryName) {
            newOrder.splice(newOrder.indexOf(parentCategoryName) + 1, 0, newCategoryName);
        } else {
            newOrder.push(newCategoryName);
        }

        return newOrder;
    }


    export function deleteCategory(category: CategoryForm,
                                   customConfigurationDocument: ConfigurationDocument,
                                   removeFromCategoriesOrder: boolean = true): ConfigurationDocument {

        const clonedConfigurationDocument = Document.clone(customConfigurationDocument);
        delete clonedConfigurationDocument.resource.forms[category.libraryId ?? category.name];

        CustomLanguageConfigurations.deleteCategory(
            clonedConfigurationDocument.resource.languages, category
        );

        if (removeFromCategoriesOrder) {
            clonedConfigurationDocument.resource.order
                = clonedConfigurationDocument.resource.order.filter(categoryName => categoryName !== category.name);
        }

        return clonedConfigurationDocument;
    }


    export function deleteGroup(category: CategoryForm, group: Group,
                                otherCategories: Array<CategoryForm>,
                                customConfigurationDocument: ConfigurationDocument): ConfigurationDocument {

        const clonedConfigurationDocument = Document.clone(customConfigurationDocument);
        const clonedCategoryConfiguration = clonedConfigurationDocument.resource
            .forms[category.libraryId ?? category.name];
        clonedCategoryConfiguration.groups = clonedCategoryConfiguration.groups.filter(g => g.name !== group.name);

        if (!otherCategories.find(category => category.groups.find(g => g.name === group.name))) {
            CustomLanguageConfigurations.update(
                clonedConfigurationDocument.resource.languages, {}, {}, category, undefined, group
            );
        }

        return clonedConfigurationDocument;
    }


    export function deleteField(category: CategoryForm, field: Field,
                                customConfigurationDocument: ConfigurationDocument): ConfigurationDocument {

        const clonedConfigurationDocument = Document.clone(customConfigurationDocument);
        const clonedCategoryConfiguration = clonedConfigurationDocument.resource
            .forms[category.libraryId ?? category.name];
        delete clonedCategoryConfiguration.fields[field.name];

        const groupDefinition = clonedCategoryConfiguration.groups.find(
            group => group.fields.includes(field.name)
        );
        groupDefinition.fields = groupDefinition.fields.filter(f => f !== field.name);

        CustomLanguageConfigurations.update(
            clonedConfigurationDocument.resource.languages, {}, {}, category, field
        );

        return clonedConfigurationDocument;
    }


    export function isEditableGroup(group: Group): boolean {

        return group.name !== Groups.PARENT && group.name !== Groups.CHILD;
    }


    export function isCustomizedCategory(configurationDocument: ConfigurationDocument,
                                         category: CategoryForm): boolean {

        const customDefinition: CustomFormDefinition = configurationDocument.resource
            .forms[category.libraryId ?? category.name];

        return customDefinition.color !== undefined
            || customDefinition.groups !== undefined
            || (customDefinition.valuelists !== undefined && !isEmpty(customDefinition.valuelists))
            || (customDefinition.fields !== undefined && !isEmpty(customDefinition.fields))
            || (customDefinition.hidden !== undefined && !isEmpty(customDefinition.hidden))
            || CustomLanguageConfigurations.hasCustomTranslations(
                configurationDocument.resource.languages, category
            );
    }


    export function getPermanentlyHiddenFields(configurationDocument: ConfigurationDocument,
                                               category: CategoryForm): string[] {

        const groups: Array<Group> = category.groups.filter(group => group.name !== Groups.HIDDEN_CORE_FIELDS);

        const result: string[] = flatten(groups.map(to('fields')))
            .filter(field => !field.visible
                && !OVERRIDE_VISIBLE_FIELDS.includes(field.name)
                && (category.source === 'custom' || !ConfigurationUtil.isHidden(
                    getCustomCategoryDefinition(configurationDocument, category),
                    getParentCustomCategoryDefinition(configurationDocument, category)
                )(field)))
            .map(Named.toName);

        if (category.name === 'Project') result.push(Resource.IDENTIFIER);

        return result;
    }


    export function getCustomCategoryDefinition(configurationDocument: ConfigurationDocument,
                                                category: CategoryForm): CustomFormDefinition|undefined {

        return configurationDocument.resource.forms[category.libraryId ?? category.name];
    }


    export function getParentCustomCategoryDefinition(configurationDocument: ConfigurationDocument,
                                                      category: CategoryForm): CustomFormDefinition|undefined {

        return category.parentCategory
            ? configurationDocument.resource.forms[category.libraryId ?? category.parentCategory.name]
            : undefined;
    }
}
