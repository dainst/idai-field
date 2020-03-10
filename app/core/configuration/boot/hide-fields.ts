import {clone, keysAndValues, Map, Pair} from 'tsfun';
import {CustomTypeDefinition} from '../model/custom-type-definition';
import {TransientTypeDefinition} from '../model/transient-type-definition';


export function hideFields(customTypes: Map<CustomTypeDefinition>) {

    return (selectedTypes_: Map<TransientTypeDefinition>) => {

        const selectedTypes = clone(selectedTypes_);

        keysAndValues(selectedTypes).forEach(
            ([selectedTypeName, selectedType]: Pair<string, TransientTypeDefinition>) => {

                keysAndValues(customTypes).forEach(
                    ([customTypeName, customType]: Pair<string, CustomTypeDefinition>) => {

                        if (customTypeName === selectedTypeName && selectedType.fields) {

                            Object.keys(selectedType.fields).forEach(fieldName => {
                                if (customType.hidden && customType.hidden.includes(fieldName)) {
                                    selectedType.fields[fieldName].visible = false;
                                    selectedType.fields[fieldName].editable = false;
                                }

                                if (selectedType.fields[fieldName].visible === undefined) selectedType.fields[fieldName].visible = true;
                                if (selectedType.fields[fieldName].editable === undefined) selectedType.fields[fieldName].editable = true;
                            })
                        }
                    })
            });

        return selectedTypes;
    }
}