import { flatten, to } from 'tsfun';
import { Category, CustomCategoryDefinition, FieldDefinition, FieldResource, Resource,
    GroupDefinition, Group, Groups, Document, ConfigurationDocument } from 'idai-field-core';


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
            .map(to('name'))
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


    export function deleteField(category: Category, field: FieldDefinition,
                                customConfigurationDocument: ConfigurationDocument): ConfigurationDocument {

        const clonedConfigurationDocument = Document.clone(customConfigurationDocument);
        const clonedCategoryConfiguration = clonedConfigurationDocument.resource
            .categories[category.libraryId ?? category.name];
        delete clonedCategoryConfiguration.fields[field.name];

        if (clonedCategoryConfiguration.groups) {
            const groupDefinition = clonedCategoryConfiguration.groups.find(
                group => group.fields.includes(field.name)
            );
            groupDefinition.fields = groupDefinition.fields.filter(f => f !== field.name);
        }

        return clonedConfigurationDocument;
    }


    export function isEditableGroup(group: Group): boolean {

        return group.name !== Groups.PARENT && group.name !== Groups.CHILD;
    }
}
