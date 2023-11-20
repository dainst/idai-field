export type WarningType = 'unconfigured'
    |'invalid'
    |'outlierValues'
    |'missingRelationTargets'
    |'conflicts'
    |'missingIdentifierPrefix'
    |'nonUniqueIdentifier'
    |'resourceLimitExceeded';


export interface Warnings {

    unconfigured: string[];
    invalid: string[];
    outlierValues: string[];
    missingRelationTargets?: MissingRelationTargetWarnings
    conflicts?: boolean;
    missingIdentifierPrefix?: boolean;
    nonUniqueIdentifier?: boolean;
    resourceLimitExceeded?: boolean;
}


export interface MissingRelationTargetWarnings {
    
    relationNames: string[];
    targetIds: string[];
}


/**
 * @author Thomas Kleinke
 */
export module Warnings {

    export function hasWarnings(warnings: Warnings): boolean {

        return warnings.unconfigured.length > 0
            || warnings.invalid.length > 0
            || warnings.outlierValues.length > 0
            || warnings.missingRelationTargets !== undefined
            || warnings.conflicts
            || warnings.missingIdentifierPrefix
            || warnings.nonUniqueIdentifier
            || warnings.resourceLimitExceeded;
    }


    export function createDefault(): Warnings {

        return {
            unconfigured: [],
            invalid: [],
            outlierValues: []
        };
    }
}
