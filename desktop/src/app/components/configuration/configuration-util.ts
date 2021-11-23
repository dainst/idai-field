import { clone, flatten, to } from 'tsfun';
import { CategoryForm, Field, GroupDefinition, Group, Groups, Named } from 'idai-field-core';


export type InputType = {
    name: string;
    label: string;
    searchable?: boolean;
    customFields?: boolean;
};


/**
 * @author Thomas Kleinke
 */
export module ConfigurationUtil {

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


    export function isEditableGroup(group: Group): boolean {

        return group.name !== Groups.PARENT && group.name !== Groups.CHILD;
    }


    export function getInputTypeLabel(inputTypeName: string, availableInputTypes: Array<InputType>): string {

        return availableInputTypes
            .find(inputType => inputType.name === inputTypeName)
            .label;
    }
}
