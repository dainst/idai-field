import { equal, flatten, isEmpty, to } from 'tsfun';
import { CategoryForm, Field, Named, ProjectConfiguration, SemanticReference, Relation } from 'idai-field-core';
import { validateReferences, validateSemanticReferences } from './validation/validate-references';


export type InputType = {
    name: Field.InputType;
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
                case 'inventory':
                    return category.name === 'StoragePlace';
                case 'workflow':
                    return category.name === 'Process';
                default:
                    return filter.isRecordedInCategory
                        ? Relation.isAllowedRelationDomainCategory(
                            projectConfiguration.getRelations(),
                            category.name,
                            filter.isRecordedInCategory,
                            Relation.Hierarchy.RECORDEDIN
                        ) || category.name === 'Process'
                        : !projectConfiguration.getRelationsForDomainCategory(category.name)
                                .map(to('name')).includes(Relation.Hierarchy.RECORDEDIN)
                            && !['Image', 'Type', 'TypeCatalog', 'StoragePlace', 'Process']
                                .includes(category.name);
            }
        });
    }


    /**
     * @throws M.CONFIGURATION_ERROR_INVALID_REFERENCE if validation fails
     */
    export function cleanUpAndValidateReferences(object: any) {

        object.references = object.references.filter(reference => reference.length);
        validateReferences(object.references);

        if (isEmpty(object.references)) delete object.references;
    }


    /**
     * @throws M.CONFIGURATION_ERROR_INVALID_REFERENCE if validation fails
     */
    export function cleanUpAndValidateSemanticReferences(object: any) {

        object.semanticReferences = object.semanticReferences.filter(reference => reference.uri?.length);
        validateSemanticReferences(object.semanticReferences);

        if (isEmpty(object.semanticReferences)) delete object.semanticReferences;
    }


    export function isReferencesArrayChanged(object: any, editedObject: any): boolean {

        const originalReferences: string[] = object.references
            ? object.references.filter(reference => reference.length)
            : [];
        
        const editedReferences: string[] = editedObject.references
            ? editedObject.references.filter(reference => reference.length)
            : [];

        return !equal(originalReferences)(editedReferences);
    }


    export function isSemanticReferencesArrayChanged(object: any, editedObject: any): boolean {

        const originalReferences: Array<SemanticReference> = object.semanticReferences
            ? object.semanticReferences.filter(reference => reference.uri?.length)
            : [];
        
        const editedReferences: Array<SemanticReference> = editedObject.semanticReferences
            ? editedObject.semanticReferences.filter(reference => reference.uri?.length)
            : [];

        return !equal(originalReferences)(editedReferences);
    }
}
