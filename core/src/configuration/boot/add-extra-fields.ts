import {clone, Map, update} from 'tsfun';
import {Field} from '../../model';
import {TransientCategoryDefinition} from '../model/transient-category-definition';


export function addExtraFields(extraFields: Map<Field>) {

    return (configuration: Map<TransientCategoryDefinition>) => {

        return Object.keys(configuration)
            .reduce((configuration: Map<TransientCategoryDefinition>, categoryName: string) => {

            return update(categoryName, addExtraFieldsToCategory(extraFields))(configuration);

        }, configuration);
    };
}


function addExtraFieldsToCategory(extraFields: Map<Field>) {

    return (categoryDefinition: TransientCategoryDefinition) => {

        const newCategoryDefinition: any = clone(categoryDefinition);
        if (!newCategoryDefinition.fields) newCategoryDefinition.fields = {};
        if (newCategoryDefinition.parent === undefined) _addExtraFields(newCategoryDefinition, extraFields);
        return newCategoryDefinition
    }
}


function _addExtraFields(categoryDefinition: TransientCategoryDefinition,
                         extraFields: { [fieldName: string]: Field }) {

    for (let extraFieldName of Object.keys(extraFields)) {
        let fieldAlreadyPresent = false;

        for (let fieldName of Object.keys(categoryDefinition.fields)) {
            if (fieldName === extraFieldName) fieldAlreadyPresent = true;
        }

        if (!fieldAlreadyPresent) {
            categoryDefinition.fields[extraFieldName] = Object.assign({}, extraFields[extraFieldName]);
        }
    }
}
