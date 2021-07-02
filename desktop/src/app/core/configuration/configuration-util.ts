import { flatten, to } from 'tsfun';
import { Category, CustomCategoryDefinition, FieldDefinition, FieldResource, Resource,
    GroupDefinition } from 'idai-field-core';


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
}
