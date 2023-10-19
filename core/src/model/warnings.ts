export type WarningType = 'unconfigured'
    |'invalid'
    |'outlierValues'
    |'conflicts'
    |'missingIdentifierPrefix'
    |'nonUniqueIdentifier';


export interface Warnings {

    unconfigured: string[];
    invalid: string[];
    outlierValues: string[];
    conflicts?: boolean;
    missingIdentifierPrefix?: boolean;
    nonUniqueIdentifier?: boolean;
}


/**
 * @author Thomas Kleinke
 */
export module Warnings {

    export function hasWarnings(warnings: Warnings): boolean {

        return warnings.unconfigured.length > 0
            || warnings.invalid.length > 0
            || warnings.outlierValues.length > 0
            || warnings.conflicts
            || warnings.missingIdentifierPrefix
            || warnings.nonUniqueIdentifier;
    }


    export function createDefault(): Warnings {

        return {
            unconfigured: [],
            invalid: [],
            outlierValues: []
        };
    }
}
