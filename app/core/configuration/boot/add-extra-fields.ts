import {clone, keys, Map, reduce, update} from 'tsfun';
import {FieldDefinition} from '../model/field-definition';
import {TransientTypeDefinition} from '../model/transient-type-definition';


export function addExtraFields(extraFields: Map<FieldDefinition>) {

    return (configuration: Map<TransientTypeDefinition>) => {

        return reduce((configuration: Map<TransientTypeDefinition>, typeName: string) => {

            return update(typeName, addExtraFieldsToType(extraFields))(configuration);

        }, configuration)(keys(configuration));
    };
}


function addExtraFieldsToType(extraFields: Map<FieldDefinition>) {

    return (typeDefinition: TransientTypeDefinition) => {

        const newTypeDefinition = clone(typeDefinition);
        if (!newTypeDefinition.fields) newTypeDefinition.fields = {};
        if (newTypeDefinition.parent === undefined) _addExtraFields(newTypeDefinition, extraFields);
        return newTypeDefinition
    }
}


function _addExtraFields(typeDefinition: TransientTypeDefinition,
                         extraFields: {[fieldName: string]: FieldDefinition }) {

    for (let extraFieldName of Object.keys(extraFields)) {
        let fieldAlreadyPresent = false;

        for (let fieldName of Object.keys(typeDefinition.fields)) {
            if (fieldName === extraFieldName) fieldAlreadyPresent = true;
        }

        if (!fieldAlreadyPresent) {
            typeDefinition.fields[extraFieldName] = Object.assign({}, extraFields[extraFieldName]);
        }
    }
}