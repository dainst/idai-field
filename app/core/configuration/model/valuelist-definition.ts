import {ConfigurationErrors} from '../configuration-errors';

// @author Daniel de Oliveira


export type ValuelistId = string;


export type Valuelists = { [fieldName: string]: ValuelistId }


export interface ValuelistDefinition {

    description: { [language: string]: string }
    extends?: string; // to be implemented
    createdBy: string;
    creationDate: string;
    constraints?: any; // to be defined
    values: { [key: string]: ValueDefinition }
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