import { Map } from 'tsfun';


export type WarningType = 'unconfiguredCategory'
    |'unconfiguredFields'
    |'invalidFields'
    |'missingMandatoryFields'
    |'unfulfilledConditionFields'
    |'outliers'
    |'missingRelationTargets'
    |'invalidRelationTargets'
    |'conflicts'
    |'missingIdentifierPrefix'
    |'nonUniqueIdentifier'
    |'resourceLimitExceeded'
    |'missingOrInvalidParent'
    |'invalidProcessState'


export interface Warnings {

    unconfiguredFields: string[];
    invalidFields: string[];
    missingMandatoryFields?: string[];
    unfulfilledConditionFields?: string[];
    outliers?: OutlierWarnings;
    missingRelationTargets?: RelationTargetWarnings;
    invalidRelationTargets?: RelationTargetWarnings;
    unconfiguredCategory?: boolean;
    conflicts?: boolean;
    missingIdentifierPrefix?: boolean;
    nonUniqueIdentifier?: boolean;
    resourceLimitExceeded?: boolean;
    missingOrInvalidParent?: boolean;
    invalidProcessState?: boolean;
}


export interface OutlierWarnings {

    fields: Map<string[]|Map<string[]>>;
    values: string[];
}


export interface RelationTargetWarnings {
    
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
            || warnings.missingMandatoryFields.length > 0
            || warnings.unfulfilledConditionFields.length > 0
            || warnings.outliers !== undefined
            || warnings.missingRelationTargets !== undefined
            || warnings.invalidRelationTargets !== undefined
            || warnings.unconfiguredCategory
            || warnings.conflicts
            || warnings.missingIdentifierPrefix
            || warnings.nonUniqueIdentifier
            || warnings.resourceLimitExceeded
            || warnings.missingOrInvalidParent
            || warnings.invalidProcessState;
    }


    export function createDefault(): Warnings {

        return {
            unconfiguredFields: [],
            invalidFields: [],
            missingMandatoryFields: [],
            unfulfilledConditionFields: []
        };
    }
}
