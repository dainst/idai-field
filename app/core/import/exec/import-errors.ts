/**
 * @author Daniel de Oliveira
 * @author Thomas Kleinke
 */
export module ImportErrors {

    export const OPERATIONS_NOT_ALLOWED = 'importerrrors/prevalidation/operationsnotallowed';
    export const NO_OPERATION_ASSIGNED = 'importerrors/prevalidation/nooperationassigned';
    export const DUPLICATE_IDENTIFIER = 'importerrors/prevalidation/duplicateidentifier';
    export const MISSING_RELATION_TARGET = 'importerrors/prevalidation/missingrelationtarget'; // by identifier
    export const TYPE_NOT_ALLOWED = 'importerrors/prevalidation/typenotallowed';
    export const TYPE_ONLY_ALLOWED_ON_UPDATE = 'importerrors/prevalidation/typeonlyallowedonupdate';
    export const UPDATE_TARGET_NOT_FOUND = 'importwarnings/updatetargetnotfound';
    export const MENINX_FIND_NO_FEATURE_ASSIGNABLE = 'importerrrors/exec/meninxfind/nofeatureassignable';
    export const MENINX_NO_OPERATION_ASSIGNABLE = 'importerrrors/exec/meninxfind/nooperationassignable';
    export const ROLLBACK = 'importerrors/exec/rollback';
    export const INVALID_MAIN_TYPE_DOCUMENT = 'importerrors/invalidmaintypedocument';
    export const RESOURCE_EXISTS = 'importerrors/resourceexists'; // M.MODEL_VALIDATION_ERROR_IDENTIFIER_EXISTS
    export const EXEC_MISSING_RELATION_TARGET = 'importerrors/exec/missingrelationtarget';
    export const BAD_INTERRELATION = 'importerrors/exec/notinterrelated';
    export const EMPTY_RELATION = 'importerrors/exec/emptyrelation';
}