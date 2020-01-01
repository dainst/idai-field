import {ProjectConfiguration} from '../configuration/project-configuration';
import {Document, Dating, Dimension} from 'idai-components-2';
import {includedIn, isNot, on} from 'tsfun-core';
import {is} from 'tsfun';


/**
 * @author Daniel de Oliveira
 * @author Thomas Kleinke
 */
export module FieldConverter {


    export function preprocessDocument(projectConfiguration: ProjectConfiguration) { return (document: Document) => {

        const resource = document.resource;

        for (let field of Object.keys(resource).filter(isNot(includedIn(['relations', 'geometry', 'type'])))) {
            const fieldDefinition = projectConfiguration.getFieldDefinitions(resource.type).find(on('name', is(field)));

            if (!fieldDefinition) continue;

            if (fieldDefinition.inputType === 'dating') {
                for (let entryIndex in resource[field]) { // TODO map array
                    resource[field][entryIndex] = Dating.revert(resource[field][entryIndex]);
                }
            }

            if (fieldDefinition.inputType === 'dimension') {
                for (let entryIndex in resource[field]) { // TODO map array
                    resource[field][entryIndex] = Dimension.revert(resource[field][entryIndex]);
                }
            }
        }

        return document;
    }}


    export function postprocessDocument(projectConfiguration: ProjectConfiguration) { return (document: Document) => {

        const resource = document.resource;

        for (let field of Object.keys(resource).filter(isNot(includedIn(['relations', 'geometry', 'type'])))) {
            const fieldDefinition = projectConfiguration.getFieldDefinitions(resource.type).find(on('name', is(field)));

            // This could be and -End suffixed field of a dropdownRange input
            // However, all the necessary validation validation is assumed to have taken place already
            if (!fieldDefinition) continue;

            if (fieldDefinition.inputType === 'dating') {
                for (let dating of resource[field]) Dating.setNormalizedYears(dating);
            }

            if (fieldDefinition.inputType === 'dimension') {
                for (let dimension of resource[field]) Dimension.addNormalizedValues(dimension);
            }
        }
        return document;
    }}
}



