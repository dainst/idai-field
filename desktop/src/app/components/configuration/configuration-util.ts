import { flatten, to } from 'tsfun';
import { CategoryForm, Field, Group, Groups, Named, ProjectConfiguration, Relation } from 'idai-field-core';


export type InputType = {
    name: string;
    label: string;
    searchable?: boolean;
    customFields?: boolean;
};


export type CategoriesFilter = {
    name: string,
    label: string,
    isRecordedInCategory?: string;
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


    export function filterTopLevelCategories(topLevelCategories: Array<CategoryForm>,
                                             filter: CategoriesFilter,
                                             projectConfiguration: ProjectConfiguration): Array<CategoryForm> {

        return topLevelCategories.filter(category => {
            switch (filter.name) {
                case 'all':
                    return true;
                case 'images':
                    return category.name === 'Image';
                case 'types':
                    return ['Type', 'TypeCatalog'].includes(category.name);
                default:
                    return filter.isRecordedInCategory
                        ? Relation.isAllowedRelationDomainCategory(
                            projectConfiguration.getRelations(),
                            category.name,
                            filter.isRecordedInCategory,
                            Relation.Hierarchy.RECORDEDIN
                        )
                        : !projectConfiguration.getRelationsForDomainCategory(category.name)
                                .map(to('name')).includes(Relation.Hierarchy.RECORDEDIN)
                            && !['Image', 'Type', 'TypeCatalog'].includes(category.name);
            }
        });
    }
}
