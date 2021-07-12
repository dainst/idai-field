import { flatten, to } from 'tsfun';
import { Category, CustomCategoryDefinition, FieldDefinition, FieldResource, Resource,
    GroupDefinition, Group, Groups, Document, ConfigurationDocument, Named } from 'idai-field-core';
import { LanguageConfigurationUtil } from './language-configuration-util';


export const OVERRIDE_VISIBLE_FIELDS = [Resource.IDENTIFIER, FieldResource.SHORTDESCRIPTION];


/**
 * @author Thomas Kleinke
 */
export module ConfigurationUtil {

    export const isHidden = (customCategoryDefinition?: CustomCategoryDefinition,
                             parentCustomCategoryDefinition?: CustomCategoryDefinition) =>
            (field: FieldDefinition): boolean => {

        return (customCategoryDefinition?.hidden ?? []).includes(field.name) ||
            (parentCustomCategoryDefinition?.hidden ?? []).includes(field.name);
    }


    export function isParentField(category: Category, field: FieldDefinition): boolean {

        if (!category.parentCategory) return false;

        return flatten(category.parentCategory.groups.map(to('fields')))
            .map(Named.toName)
            .includes(field.name);
    }


    export function createGroupsConfiguration(category: Category,
                                              permanentlyHiddenFields: string[]): Array<GroupDefinition> {

        return category.groups.reduce((result, group) => {
            result.push({
                name: group.name,
                fields: group.fields
                    .filter(field => !permanentlyHiddenFields.includes(field.name))
                    .map(field => field.name)
            });
            return result;
        }, []);
    }


    export function deleteGroup(category: Category, group: Group,
                                customConfigurationDocument: ConfigurationDocument): ConfigurationDocument {

        const clonedConfigurationDocument = Document.clone(customConfigurationDocument);
        const clonedCategoryConfiguration = clonedConfigurationDocument.resource
            .categories[category.libraryId ?? category.name];
        clonedCategoryConfiguration.groups = clonedCategoryConfiguration.groups.filter(g => g.name !== group.name);

        LanguageConfigurationUtil.updateCustomLanguageConfigurations(
            clonedConfigurationDocument.resource.languages, {}, {}, category, undefined, group
        );

        return clonedConfigurationDocument;
    }


    export function deleteField(category: Category, field: FieldDefinition,
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
}
