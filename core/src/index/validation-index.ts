import { is, on } from 'tsfun';
import { CategoryForm } from '../model/configuration/category-form';
import { Field } from '../model/configuration/field';
import { Document } from '../model/document';
import { Resource } from '../model/resource';
import { Named } from '../tools/named';
import { ValuelistUtil } from '../tools/valuelist-util';


export interface ValidationInfo {

    unconfiguredFields: string[];
    invalidFields: string[];
    outlierValuesFields: string[];
}


export interface ValidationIndex {
    [resourceId: string]: ValidationInfo
};


/**
 * @author Thomas Kleinke
 */
export module ValidationIndex {

     export function put(index: ValidationIndex, document: Document, categoryDefinition: CategoryForm,
                         skipRemoval: boolean = false) {

        if (!skipRemoval) remove(index, document);

        add(index, document, categoryDefinition);
    }


    function add(index: any, document: Document, categoryDefinition: CategoryForm) {

        const entry: ValidationInfo = {
            unconfiguredFields: [],
            invalidFields: [],
            outlierValuesFields: []
        };

        const fieldDefinitions: Array<Field> = CategoryForm.getFields(categoryDefinition);

        Object.keys(document.resource)
            .filter(fieldName => ![Resource.ID, Resource.CATEGORY, Resource.RELATIONS].includes(fieldName))
            .forEach(fieldName => {
                const fieldContent: any = document.resource[fieldName];
                const fieldDefinition: Field = fieldDefinitions.find(on(Named.NAME, is(fieldName)));

                if (!fieldDefinition) {
                    entry.unconfiguredFields.push(fieldName);
                } else if (!Field.InputType.isValidFieldData(fieldContent, fieldDefinition.inputType)) {
                    entry.invalidFields.push(fieldName);
                } else if (ValuelistUtil.getValuesNotIncludedInValuelist(fieldContent, fieldDefinition.valuelist)) {
                    entry.outlierValuesFields.push(fieldName);
                }
            });

        if (entry.unconfiguredFields.length || entry.invalidFields.length || entry.outlierValuesFields.length) {
            index[document.resource.id] = entry;
        }
    }


    function remove(index: ValidationIndex, document: Document) {

        if (index[document.resource.id]) delete index[document.resource.id];
    }
}
