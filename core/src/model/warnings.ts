export type WarningType = 'unconfiguredCategory'
    |'unconfiguredFields'
    |'invalidFields'
    |'outlierValues'
    |'missingRelationTargets'
    |'conflicts'
    |'missingIdentifierPrefix'
    |'nonUniqueIdentifier'
    |'resourceLimitExceeded';


export interface Warnings {

    unconfiguredFields: string[];
    invalidFields: string[];
    outlierValues: string[];
    missingRelationTargets?: MissingRelationTargetWarnings
    unconfiguredCategory?: boolean;
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

        return warnings.unconfiguredFields.length > 0
            || warnings.invalidFields.length > 0
            || warnings.outlierValues.length > 0
            || warnings.missingRelationTargets !== undefined
            || warnings.unconfiguredCategory
            || warnings.conflicts
            || warnings.missingIdentifierPrefix
            || warnings.nonUniqueIdentifier
            || warnings.resourceLimitExceeded;
    }


    export function createDefault(): Warnings {

        return {
            unconfiguredFields: [],
            invalidFields: [],
            outlierValues: []
        };
    }
}
