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

    export function isValid(valuelistDefinition: ValuelistDefinition): boolean {

        return true; // TODO implement properly, see if we can unify handling with cases like Document.isValid
    }


    export function assertIsValid(valuelistDefinition: ValuelistDefinition) {

        // TODO throw if not is Valid
    }
}


export interface ValueDefinition {

    translation?: { [label: string]: string },
    references?: { [referenceKey: string]: string },
}


export interface ValuelistDefinitions { [key: string]: ValuelistDefinition }