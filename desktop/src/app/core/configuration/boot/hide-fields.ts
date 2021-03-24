import {clone, keysValues, Map} from 'tsfun';
import {CustomCategoryDefinition} from '../model/custom-category-definition';
import {TransientCategoryDefinition} from '../model/transient-category-definition';


export function hideFields(customCategories: Map<CustomCategoryDefinition>) {

    return (selectedCategories: Map<TransientCategoryDefinition>) => {

        const clonedSelectedCategories = clone(selectedCategories);

        keysValues(clonedSelectedCategories).forEach(
            ([selectedCategoryName, selectedCategory]: [string, TransientCategoryDefinition]) => {

                keysValues(customCategories).forEach(
                    ([customCategoryName, customCategory]: [string, CustomCategoryDefinition]) => {

                        if (customCategoryName === selectedCategoryName && selectedCategory.fields) {
                            Object.keys(selectedCategory.fields).forEach(fieldName => {
                                if (customCategory.hidden && customCategory.hidden.includes(fieldName)) {
                                    selectedCategory.fields[fieldName].visible = false;
                                    selectedCategory.fields[fieldName].editable = false;
                                }

                                if (selectedCategory.fields[fieldName].visible === undefined) selectedCategory.fields[fieldName].visible = true;
                                if (selectedCategory.fields[fieldName].editable === undefined) selectedCategory.fields[fieldName].editable = true;
                            })
                        }
                    })
            });

        return clonedSelectedCategories;
    }
}
