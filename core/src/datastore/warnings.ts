import { is, on } from 'tsfun';
import { Document, FieldWarnings } from '../model/document';
import { Named } from '../tools/named';
import { CategoryForm } from '../model/configuration/category-form';
import { Field } from '../model/configuration/field';
import { ValuelistUtil } from '../tools/valuelist-util';
import { Resource } from '../model/resource';
import { ImageResource } from '../model/image-resource';


/**
 * @author Thomas Kleinke
 */
export module Warnings {

    const FIELDS_TO_SKIP = [
        Resource.ID, Resource.IDENTIFIER, Resource.CATEGORY, Resource.RELATIONS, ImageResource.GEOREFERENCE,
        ImageResource.ORIGINAL_FILENAME
    ];


    export function getWarnings(document: Document, category: CategoryForm): FieldWarnings|undefined {

        const warnings: FieldWarnings = createWarnings(document, category);

        if (warnings.unconfigured.length || warnings.invalid.length || warnings.outlierValues.length
                || warnings.conflicts) {
            return warnings;
        } else {
            return undefined;
        }
    }


    function createWarnings(document: Document, category: CategoryForm): FieldWarnings {

        const fieldDefinitions: Array<Field> = CategoryForm.getFields(category);

        const warnings: FieldWarnings = {
            unconfigured: [],
            invalid: [],
            outlierValues: [],
            conflicts: document._conflicts !== undefined
        };

        return Object.keys(document.resource)
            .filter(fieldName => !FIELDS_TO_SKIP.includes(fieldName))
            .reduce((result, fieldName) => {
                const fieldContent: any = document.resource[fieldName];
                const field: Field = fieldDefinitions.find(on(Named.NAME, is(fieldName)));
                updateWarningsForField(warnings, fieldName, field, fieldContent);
                return result;
            }, warnings);
    }


    function updateWarningsForField(warnings: FieldWarnings, fieldName: string, field: Field, fieldContent: any) {

        if (!field) {
            warnings.unconfigured.push(fieldName);
        } else if (!Field.InputType.isValidFieldData(fieldContent, field.inputType)) {
            warnings.invalid.push(fieldName);
        } else if ([Field.InputType.DROPDOWN, Field.InputType.DROPDOWNRANGE, Field.InputType.CHECKBOXES]
                .includes(field.inputType)
                && ValuelistUtil.getValuesNotIncludedInValuelist(fieldContent, field.valuelist)) {
            warnings.outlierValues.push(fieldName);
        }
    }
}
