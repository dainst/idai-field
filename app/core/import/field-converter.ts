import {ProjectConfiguration} from '../configuration/project-configuration';
import {Document} from 'idai-components-2/src/model/core/document';
import {includedIn, isNot, on} from 'tsfun-core';
import {is} from 'tsfun';
import {DatingUtil} from '../util/dating-util';
import {DimensionUtil} from '../util/dimension-util';


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
                    resource[field][entryIndex] = DatingUtil.revert(resource[field][entryIndex]);
                }
            }

            if (fieldDefinition.inputType === 'dimension') {
                for (let entryIndex in resource[field]) { // TODO map array
                    resource[field][entryIndex] = DimensionUtil.revert(resource[field][entryIndex]);
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
                for (let dating of resource[field]) DatingUtil.setNormalizedYears(dating);
            }

            if (fieldDefinition.inputType === 'dimension') {
                for (let dimension of resource[field]) DimensionUtil.addNormalizedValues(dimension);
            }
        }
        return document;
    }}
}



