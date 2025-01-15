import { is, isNot, on, includedIn } from 'tsfun';
import { Document, Dating, Dimension, CategoryForm, ProjectConfiguration } from 'idai-field-core';


/**
 * Pre- and postprocessing of documents which depends on ProjectConfiguration.
 * We want the ProjectConfiguration dependency to stay out of DefaultImport/importDocuments.
 *
 * @author Daniel de Oliveira
 * @author Thomas Kleinke
 */
export module FieldConverter {

    /**
     * Objects stored in the database have datings and dimensions with values calculated from the user inputs.
     * We want to restore the dimensions and datings original state so that on a subsequent merge the fields
     * match exactly the potential user input.
     *
     * @param projectConfiguration
     */
    export function preprocessDocument(projectConfiguration: ProjectConfiguration) { return (document: Document) => {

        const resource = document.resource;

        for (let field of Object.keys(resource).filter(isNot(includedIn(['relations', 'geometry', 'category'])))) {

            const fieldDefinition = CategoryForm
                .getFields(projectConfiguration.getCategory(resource.category))
                .find(on('name', is(field)));

            if (!fieldDefinition) continue;

            if (fieldDefinition.inputType === 'dating') resource[field] = resource[field].map(Dating.revert);
            if (fieldDefinition.inputType === 'dimension') resource[field] = resource[field].map(Dimension.revert);
        }

        return document;
    }}


    /**
     * @param projectConfiguration
     */
    export function postprocessDocument(projectConfiguration: ProjectConfiguration) { return (document: Document) => {

        const resource = document.resource;

        for (let field of Object.keys(resource).filter(isNot(includedIn(['relations', 'geometry', 'category'])))) {
            const fieldDefinition = CategoryForm.getFields(projectConfiguration.getCategory(resource.category)).find(on('name', is(field)));

            // This could be and -End suffixed field of a dropdownRange input
            // However, all the necessary validation is assumed to have taken place already
            if (!fieldDefinition) continue;

            if (fieldDefinition.inputType === 'dating') {
                for (let dating of resource[field]) {
                    Dating.addNormalizedValues(dating);
                }
            }

            if (fieldDefinition.inputType === 'dimension') {
                for (let dimension of resource[field]) {
                    Dimension.addNormalizedValues(dimension);
                }
            }
        }
        return document;
    }}
}



