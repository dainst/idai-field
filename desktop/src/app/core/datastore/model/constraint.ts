export interface Constraint {

    value: string|string[];
    subtract?: true;
    searchRecursively?: true;
}


export module Constraint {

    export const VALUE = 'value';
    export const SUBTRACT = 'subtract';
    export const SEARCHRECURSIVELY = 'searchRecursively';


    export function convert(constraint: Constraint|string|string[]): Constraint {

        return (Array.isArray(constraint) || typeof(constraint) == 'string')
            ? { value: constraint }
            : constraint;
    }
}