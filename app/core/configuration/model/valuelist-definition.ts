/**
 * @author Daniel de Oliveira
 *
 *
 */
export interface ValuelistDefinition {

    description: { [language: string]: string }
    extends?: string; // TODO review
    createdBy: string;
    creationDate: string;
    constraints?: any; // TODO to be defined
    values: { [key: string]: ValueDefinition }
    order?: string[]; // optional, default is alphabetical TODO to be implemented, see #11413
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