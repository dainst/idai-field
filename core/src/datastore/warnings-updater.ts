import { is, on } from 'tsfun';
import { Document } from '../model/document';
import { Named } from '../tools/named';
import { CategoryForm } from '../model/configuration/category-form';
import { Field } from '../model/configuration/field';
import { ValuelistUtil } from '../tools/valuelist-util';
import { Resource } from '../model/resource';
import { ImageResource } from '../model/image-resource';
import { Warnings } from '../model/warnings';


/**
 * @author Thomas Kleinke
 */
export module WarningsUpdater {

    const FIELDS_TO_SKIP = [
        Resource.ID, Resource.IDENTIFIER, Resource.CATEGORY, Resource.RELATIONS, ImageResource.GEOREFERENCE,
        ImageResource.ORIGINAL_FILENAME
    ];


    export function updateWarnings(document: Document, category: CategoryForm) {

        if (document.resource.category === 'Configuration') return;

        const warnings: Warnings = createWarnings(document, category);
        if (Warnings.hasWarnings(warnings)) {
            document.warnings = warnings;
        } else {
            delete document.warnings;
        }
    }


    function createWarnings(document: Document, category: CategoryForm): Warnings {

        const fieldDefinitions: Array<Field> = CategoryForm.getFields(category);

        const warnings: Warnings = {
            unconfigured: [],
            invalid: [],
            outlierValues: []
        };

        if (document._conflicts) warnings.conflicts = true;
        if (isIdentifierPrefixMissing(document, category)) warnings.missingIdentifierPrefix = true;

        return Object.keys(document.resource)
            .filter(fieldName => !FIELDS_TO_SKIP.includes(fieldName))
            .reduce((result, fieldName) => {
                const fieldContent: any = document.resource[fieldName];
                const field: Field = fieldDefinitions.find(on(Named.NAME, is(fieldName)));
                updateWarningsForField(warnings, fieldName, field, fieldContent);
                return result;
            }, warnings);
    }


    function isIdentifierPrefixMissing(document: Document, category: CategoryForm): boolean {

        if (!document.resource.identifier) return false;

        return category.identifierPrefix && !document.resource.identifier.startsWith(category.identifierPrefix);
    }


    function updateWarningsForField(warnings: Warnings, fieldName: string, field: Field, fieldContent: any) {

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
