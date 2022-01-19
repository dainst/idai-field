import { flatten, to } from 'tsfun';
import { CategoryForm, Field, Group, Groups, Named } from 'idai-field-core';


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


    export function getCategoriesOrder(topLevelCategoriesArray: Array<CategoryForm>): string[] {

        return topLevelCategoriesArray.reduce((order, category) => {
            order.push(category.name);
            if (category.children) order = order.concat(category.children.map(to(Named.NAME)));
            return order;
        }, []);
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
