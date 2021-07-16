import { map } from 'tsfun';
import { Field } from '../../model/field';
import { TransientCategoryDefinition, TransientFieldDefinition } from '../model';


/**
 * @author Daniel de Oliveira
 * @author Thomas Kleinke
 */
export function orderFields(orderConfiguration: any){

    return map((category: any, k: string) => {

            category.name = k;
            category.fields = getOrderedFields(category, orderConfiguration);
            return category;
        });
}


function getOrderedFields(category: TransientCategoryDefinition, 
                          orderConfiguration: any): Array<Field> {

    const fields: Array<Field> = [];

    if (!category.fields) return fields;

    if (orderConfiguration.fields[category.name]) {
        orderConfiguration.fields[category.name].forEach((fieldName: string) => {
            const field: TransientFieldDefinition | undefined = category.fields[fieldName];
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


function addToOrderedFields(field: TransientFieldDefinition, fieldName: string, 
                            fields: Array<TransientFieldDefinition>) {

    if (fields.includes(field)) return;

    field.name = fieldName;
    fields.push(field);
}
