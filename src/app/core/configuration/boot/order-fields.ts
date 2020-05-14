import {map} from 'tsfun/associative';
import {CategoryDefinition} from '../model/category-definition';
import {FieldDefinition} from '../model/field-definition';


/**
 * @author Daniel de Oliveira
 * @author Thomas Kleinke
 */
export function orderFields(orderConfiguration: any){

    return (categories_: any): any  => {

        return map((category: any, k: string) => {

            category.name = k;
            category.fields = getOrderedFields(category, orderConfiguration);
            return category;

        })(categories_);
    }
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
