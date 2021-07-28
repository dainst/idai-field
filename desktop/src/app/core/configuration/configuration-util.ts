import { clone, flatten, isEmpty, to } from 'tsfun';
import { Category, CustomCategoryDefinition, Field, FieldResource, Resource,
    GroupDefinition, Group, Groups, Document, ConfigurationDocument, Named } from 'idai-field-core';
import { CustomLanguageConfigurations } from './custom-language-configurations';


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


    export function getCategoriesOrder(topLevelCategoriesArray: Array<Category>): string[] {

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


    export function deleteCategory(category: Category,
                                   customConfigurationDocument: ConfigurationDocument,
                                   removeFromCategoriesOrder: boolean = true): ConfigurationDocument {

        const clonedConfigurationDocument = Document.clone(customConfigurationDocument);
        delete clonedConfigurationDocument.resource.categories[category.libraryId ?? category.name];

        CustomLanguageConfigurations.deleteCategory(
            clonedConfigurationDocument.resource.languages, category
        );

        if (removeFromCategoriesOrder) {
            clonedConfigurationDocument.resource.order
                = clonedConfigurationDocument.resource.order.filter(categoryName => categoryName !== category.name);
        }

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
            CustomLanguageConfigurations.update(
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

        CustomLanguageConfigurations.update(
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
            || CustomLanguageConfigurations.hasCustomTranslations(
                configurationDocument.resource.languages, category
            );
    }


    export function getPermanentlyHiddenFields(configurationDocument: ConfigurationDocument,
                                               category: Category): string[] {

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
                                                category: Category): CustomCategoryDefinition|undefined {

        return configurationDocument.resource.categories[category.libraryId ?? category.name];
    }


    export function getParentCustomCategoryDefinition(configurationDocument: ConfigurationDocument,
                                                      category: Category): CustomCategoryDefinition|undefined {

        return category.parentCategory
            ? configurationDocument.resource.categories[category.libraryId ?? category.parentCategory.name]
            : undefined;
    }
}
