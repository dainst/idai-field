import { is, isNot, on, includedIn } from 'tsfun';
import { Document, Dating, Measurement, CategoryForm, ProjectConfiguration, Field } from 'idai-field-core';


/**
 * Pre- and postprocessing of documents which depends on ProjectConfiguration.
 * We want the ProjectConfiguration dependency to stay out of DefaultImport/importDocuments.
 *
 * @author Daniel de Oliveira
 * @author Thomas Kleinke
 */
export module FieldConverter {

    /**
     * Objects stored in the database have datings and measurements with values calculated from the user inputs.
     * We want to restore the measurements and datings to their original state so that on a subsequent merge the
     * fields match exactly the potential user input.
     *
     * @param projectConfiguration
     */
    export function preprocessDocument(projectConfiguration: ProjectConfiguration) {

        return (document: Document) => {

            const fields: Array<Field> = CategoryForm.getFields(
                projectConfiguration.getCategory(document.resource.category)
            );

            const fieldNames: string[] = Object.keys(document.resource).filter(fieldName => {
                return !['relations', 'geometry', 'category'].includes(fieldName);
            });

            for (let fieldName of fieldNames) {
                const field: Field = fields.find(field => field.name === fieldName);
                if (!field) continue;

                if (field.inputType === Field.InputType.DATING) {
                    document.resource[fieldName] = document.resource[fieldName].map(Dating.revert);
                } else if (Field.InputType.MEASUREMENT_INPUT_TYPES.includes(field.inputType)) {
                    document.resource[fieldName] = document.resource[fieldName].map(Measurement.revert);
                }
            }

            return document;
        }
    }


    /**
     * @param projectConfiguration
     */
    export function postprocessDocument(projectConfiguration: ProjectConfiguration) {
        
        return (document: Document) => {

            const fields: Array<Field> = CategoryForm.getFields(
                projectConfiguration.getCategory(document.resource.category)
            );

            const fieldNames: string[] = Object.keys(document.resource).filter(fieldName => {
                return !['relations', 'geometry', 'category'].includes(fieldName);
            });

            for (let fieldName of fieldNames) {
                const field: Field = fields.find(fieldDefinition => fieldDefinition.name === fieldName);

                // This could be an -End suffixed field of a dropdownRange input
                // However, all the necessary validation is assumed to have taken place already
                if (!field) continue;

                if (field.inputType === Field.InputType.DATING) {
                    for (let dating of document.resource[fieldName]) {
                        Dating.addNormalizedValues(dating);
                    }
                }

                if (Field.InputType.MEASUREMENT_INPUT_TYPES.includes(field.inputType)) {
                    for (let measurement of document.resource[fieldName]) {
                        Measurement.addNormalizedValues(measurement);
                    }
                }
            }
            return document;
        }
    }
}



