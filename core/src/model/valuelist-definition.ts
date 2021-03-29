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

    export function assertIsValid(valuelistDefinition: ValuelistDefinition) {

        if (valuelistDefinition.description === undefined) return ['missing', 'description'];
        if (valuelistDefinition.createdBy === undefined) return ['missing', 'createdBy'];
        if (valuelistDefinition.creationDate === undefined) return ['missing', 'creationDate'];
        return undefined;
    }
}


export interface ValueDefinition {

    labels?: { [locale: string]: string },
    references?: { [referenceKey: string]: string },
}
