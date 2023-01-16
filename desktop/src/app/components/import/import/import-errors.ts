/**
 * @author Daniel de Oliveira
 * @author Thomas Kleinke
 */
export module ImportErrors {

    export const INVALID_CATEGORY = 'ImportErrors.invalidCategory';
    export const OPERATIONS_NOT_ALLOWED = 'ImportErrors.operationsNotAllowed';
    export const NO_PARENT_ASSIGNED = 'ImportErrors.noParentAssigned';
    export const DUPLICATE_IDENTIFIER = 'ImportErrors.duplicateIdentifier';
    export const PREVALIDATION_MISSING_RELATION_TARGET = 'ImportErrors.prevalidationMissingRelationTarget'; // by identifier
    export const MISSING_RELATION_TARGET = 'ImportErrors.missingRelationTarget';
    export const CATEGORY_NOT_ALLOWED = 'ImportErrors.categoryNotAllowed';
    export const CATEGORY_ONLY_ALLOWED_ON_UPDATE = 'ImportErrors.categoryOnlyAllowedOnUpdate';
    export const UPDATE_TARGET_NOT_FOUND = 'ImportErrors.updateTargetNotFound';
    export const MENINX_FIND_NO_FEATURE_ASSIGNABLE = 'ImportErrors.meninxfind.noFeatureAssignable';
    export const MENINX_NO_OPERATION_ASSIGNABLE = 'ImportErrors.meninxfind.noOperationAssignable';
    export const ROLLBACK = 'ImportErrors.rollback';
    export const INVALID_OPERATION = 'ImportErrors.invalidOperation';
    export const RESOURCE_EXISTS = 'ImportErrors.resourceExists'; // M.MODEL_VALIDATION_ERROR_IDENTIFIER_EXISTS
    export const BAD_INTERRELATION = 'ImportErrors.notInterrelated';
    export const EMPTY_RELATION = 'ImportErrors.emptyRelation';
    export const INVALID_RELATIONS = 'ImportErrors.invalidRelations';
    export const INVALID_FIELDS = 'ImportErrors.invalidFields';
    export const MUST_LIE_WITHIN_OTHER_NON_OPERATON_RESOURCE = 'ImportErrors.mustLieWithinNonOperationResource';
    export const LIES_WITHIN_TARGET_NOT_MATCHES_ON_IS_RECORDED_IN = 'ImportErrors.liesWithinTargetNotMatchesIsRecordedIn';
    export const PARENT_ASSIGNMENT_TO_OPERATIONS_NOT_ALLOWED = 'ImportErrors.parentAssignmentOperationnotallowed';
    export const PARENT_MUST_NOT_BE_ARRAY = 'ImportErrors.parentMustNotBeArray';
    export const MUST_BE_ARRAY = 'ImportErrors.relationMustBeArray';
    export const MUST_BE_IN_SAME_OPERATION = 'ImportErrors.mustBeInSameOperation';
    export const MUST_NOT_BE_EMPTY_STRING = 'ImportErrors.mustNotBeEmptyString';
    export const TARGET_CATEGORY_RANGE_MISMATCH = 'ImportErrors.targetCategoryRangeMismatch';
    export const CATEGORY_CANNOT_BE_CHANGED = 'ImportErrors.categoryCannotBeChanged';
    export const EMPTY_SLOTS_IN_ARRAYS_FORBIDDEN = 'ImportErrors.emptySlotsInArraysForbidden';
    export const ARRAY_OF_HETEROGENEOUS_TYPES = 'ImportErrors.arrayOfHeterogeneousTypes';
    export const EMPTY_OBJECT_IN_RESOURCE = 'ImportErrors.emptyObjectInResource';
    export const INVALID_IDENTIFIER_PREFIX = 'ImportErrors.invalidIdentifierPrefix';
}
