import {CategoryDefinition} from '../model/category-definition';
import {FieldDefinition} from '../model/field-definition';


/**
 * @author Daniel de Oliveira
 * @author Thomas Kleinke
 */
export function getOrderedCategories(orderConfiguration: any){

    return (categories_: any): any  => {

        const categories: Array<CategoryDefinition> = [];

        if (orderConfiguration.categories) {
            orderConfiguration.categories.forEach((categoryName: string) => {
                const category: CategoryDefinition | undefined = categories_[categoryName];
                if (category) addToOrderedCategories(category, categoryName, categories, orderConfiguration);
            });
        }

        Object.keys(categories_).forEach(categoryName => {
            if (!categories.find(category => category.name === categoryName)) {
                addToOrderedCategories(
                    categories_[categoryName], categoryName, categories, orderConfiguration
                );
            }
        });

        return categories;
    }
}


function addToOrderedCategories(category: CategoryDefinition, categoryName: string,
                                categories: Array<CategoryDefinition>, orderConfiguration: any) {

    if (categories.includes(category)) return;

    category.name = categoryName;
    category.fields = getOrderedFields(category, orderConfiguration);
    categories.push(category);
}


function getOrderedFields(category: CategoryDefinition, orderConfiguration: any): Array<FieldDefinition> {

    const fields: Array<FieldDefinition> = [];

    if (!category.fields) return fields;

    if (orderConfiguration.fields[category.name]) {
        orderConfiguration.fields[category.name].forEach((fieldName: string) => {
            const field: FieldDefinition | undefined = category.fields[fieldName];
            if (field) addToOrderedFields(field, fieldName, fields);
        });
    }

    Object.keys(category.fields).forEach(fieldName => {
        if (!fields.find(field => field.name === fieldName)) {
            addToOrderedFields(category.fields[fieldName], fieldName, fields);
        }
    });

    return fields;
}


function addToOrderedFields(field: FieldDefinition, fieldName: string, fields: Array<FieldDefinition>) {

    if (fields.includes(field)) return;

    field.name = fieldName;
    fields.push(field);
}