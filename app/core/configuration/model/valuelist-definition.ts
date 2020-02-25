
import {ConfigurationErrors} from '../boot/configuration-errors';


export type ValuelistId = string;

export type Valuelists = { [fieldName: string]: ValuelistId }


/**
 * @author Daniel de Oliveira
 */
export interface ValuelistDefinition {

    values: { [key: string]: ValueDefinition }

    description: { [language: string]: string }
    createdBy: string;
    creationDate: string;

    extends?: string; // to be implemented
    constraints?: any; // to be implemented

    // In the default case it is assumed that the order
    // in which the valuelist's entries are displayed does not matter.
    // For cases in which it does matter, one can specify the display order.
    order?: string[]; // to be implemented
}


export module ValuelistDefinition {

    export function assertIsValid([valuelistId, valuelistDefinition]: [string, ValuelistDefinition]) {

        if (valuelistDefinition.description === undefined) throw [ConfigurationErrors.MISSING_TYPE_PROPERTY, 'description', valuelistId];
        if (valuelistDefinition.createdBy === undefined) throw [ConfigurationErrors.MISSING_TYPE_PROPERTY, 'createdBy', valuelistId];
        if (valuelistDefinition.creationDate === undefined) throw [ConfigurationErrors.MISSING_TYPE_PROPERTY, 'creationDate', valuelistId];
    }
}


export interface ValueDefinition {

    translation?: { [label: string]: string },
    references?: { [referenceKey: string]: string },
}


export interface ValuelistDefinitions { [valuelistId: string]: ValuelistDefinition }