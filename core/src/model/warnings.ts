import { Map } from 'tsfun';


export type WarningType = 'unconfiguredCategory'
    |'unconfiguredFields'
    |'invalidFields'
    |'outliers'
    |'missingRelationTargets'
    |'conflicts'
    |'missingIdentifierPrefix'
    |'nonUniqueIdentifier'
    |'resourceLimitExceeded'
    |'missingOrInvalidParent';


export interface Warnings {

    unconfiguredFields: string[];
    invalidFields: string[];
    outliers?: OutlierWarnings;
    missingRelationTargets?: MissingRelationTargetWarnings;
    unconfiguredCategory?: boolean;
    conflicts?: boolean;
    missingIdentifierPrefix?: boolean;
    nonUniqueIdentifier?: boolean;
    resourceLimitExceeded?: boolean;
    missingOrInvalidParent?: boolean;
}


export interface OutlierWarnings {

    fields: Map<string[]|Map<string[]>>;
    values: string[];
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
            || warnings.outliers !== undefined
            || warnings.missingRelationTargets !== undefined
            || warnings.unconfiguredCategory
            || warnings.conflicts
            || warnings.missingIdentifierPrefix
            || warnings.nonUniqueIdentifier
            || warnings.resourceLimitExceeded
            || warnings.missingOrInvalidParent;
    }


    export function createDefault(): Warnings {

        return {
            unconfiguredFields: [],
            invalidFields: []
        };
    }
}
