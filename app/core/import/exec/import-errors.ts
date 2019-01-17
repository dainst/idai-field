/**
 * @author Daniel de Oliveira
 * @author Thomas Kleinke
 */
export module ImportErrors {

    export const INVALID_TYPE = 'ImportErrors.invalidType';
    export const OPERATIONS_NOT_ALLOWED = 'ImportErrors.operationsNotAllowed';
    export const NO_LIES_WITHIN_SET = 'ImportErrors.noOperationAssigned';
    export const DUPLICATE_IDENTIFIER = 'ImportErrors.duplicateIdentifier';
    export const MISSING_RELATION_TARGET = 'ImportErrors.missingRelationTarget'; // by identifier
    export const EXEC_MISSING_RELATION_TARGET = 'ImportErrors.missingRelationTarget';
    export const TYPE_NOT_ALLOWED = 'ImportErrors.typeNotAllowed';
    export const TYPE_ONLY_ALLOWED_ON_UPDATE = 'ImportErrors.typeOnlyAllowedOnUpdate';
    export const UPDATE_TARGET_NOT_FOUND = 'ImportErrors.updateTargetNotFound';
    export const MENINX_FIND_NO_FEATURE_ASSIGNABLE = 'ImportErrors.meninxfind.noFeatureAssignable';
    export const MENINX_NO_OPERATION_ASSIGNABLE = 'ImportErrors.meninxfind.noOperationAssignable';
    export const ROLLBACK = 'ImportErrors.rollback';
    export const INVALID_MAIN_TYPE_DOCUMENT = 'ImportErrors.invalidMainTypeDocument';
    export const RESOURCE_EXISTS = 'ImportErrors.resourceExists'; // M.MODEL_VALIDATION_ERROR_IDENTIFIER_EXISTS
    export const BAD_INTERRELATION = 'ImportErrors.notInterrelated';
    export const EMPTY_RELATION = 'ImportErrors.emptyRelation';
    export const INVALID_RELATIONS = 'ImportErrors.invalidRelations';
    export const INVALID_FIELDS = 'ImportErrors.invalidFields';
    export const LIES_WITHIN_TARGET_NOT_MATCHES_ON_IS_RECORDED_IN = 'ImportErrors.liesWithinTargetNotMatchesisrecordedin';
    export const PARENT_ASSIGNMENT_TO_OPERATIONS_NOT_ALLOWED = 'ImportErrors.parentAssignmentOperationnotallowed';
    export const PARENT_MUST_NOT_BE_ARRAY = 'ImportErrors.parentMustNotBeArray';
}