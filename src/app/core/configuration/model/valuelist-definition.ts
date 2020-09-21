import {ConfigurationErrors} from '../boot/configuration-errors';


export type ValuelistId = string;

export type Valuelists = { [fieldName: string]: ValuelistId }


/**
 * @author Daniel de Oliveira
 */
export interface ValuelistDefinition {

    id: string;
    values: { [key: string]: ValueDefinition }

    description?: { [language: string]: string }
    createdBy?: string;
    creationDate?: string;

    // Valuelists are shown in alphabetical order per default.
    // For cases in which another order is required, it can be specified in this property.
    order?: string[];

    extends?: string; // to be implemented
    constraints?: any; // to be implemented
}


export module ValuelistDefinition {

    export function assertIsValid(valuelistDefinition: ValuelistDefinition, valuelistId: string) {

        if (valuelistDefinition.description === undefined) throw [ConfigurationErrors.MISSING_CATEGORY_PROPERTY, 'description', valuelistId];
        if (valuelistDefinition.createdBy === undefined) throw [ConfigurationErrors.MISSING_CATEGORY_PROPERTY, 'createdBy', valuelistId];
        if (valuelistDefinition.creationDate === undefined) throw [ConfigurationErrors.MISSING_CATEGORY_PROPERTY, 'creationDate', valuelistId];
    }
}


export interface ValueDefinition {

    labels?: { [locale: string]: string },
    references?: { [referenceKey: string]: string },
}
