/**
 * @author Daniel de Oliveira
 */
export module ConfigurationErrors {

    export const INVALID_CONFIG_DUPLICATETYPE = 'config/error/duplicatetype';
    export const INVALID_CONFIG_MULTIPLEUSEOFDATING = 'config/error/multipleuseofdating';
    export const INVALID_CONFIG_MISSINGPARENTTYPE = 'config/error/missingparenttype';
    export const INVALID_CONFIG_INVALIDTYPE = 'config/error/invalidtype';
    export const INVALID_CONFIG_MISSINGVALUELIST = 'config/error/missingvaluelist';
    export const INVALID_CONFIG_MISSINGFIELDNAME = 'config/error/missingfieldname';
    export const INVALID_CONFIG_MISSINGRELATIONTYPE = 'config/error/missingrelationtype';

    export const VALIDATION_ERROR_INVALIDINPUTTYPE = 'config/error/validationerrorinvalidinputtype';

    export const INVALID_CONFIG_PARENT_NOT_DEFINED = 'config/fields/custom/parentnotdefined';
    export const INVALID_CONFIG_PARENT_NOT_TOP_LEVEL = 'config/fields/custom/parentnotatopleveltype';

    // mergeTypes
    export const DUPLICATION_IN_SELECTION = 'configuration/mergeTypes/duplicationinselection';
    export const MUST_HAVE_PARENT = 'configuration/mergeTypes/musthaveparent';
    export const MUST_HAVE_TYPE_FAMILY = 'configuration/mergeTypes/musthavetypefamily';
    export const MISSING_TYPE_PROPERTY = 'configuration/mergeTypes/missingTypeProperty';
    export const MISSING_FIELD_PROPERTY = 'configuration/mergeTypes/missingFieldProperty';
    export const MUST_NOT_SET_INPUT_TYPE = 'configuration/mergeTypes/mustNotSetInputType';
    export const ILLEGAL_FIELD_INPUT_TYPE = 'configuration/mergeTypes/illegalFieldType';
    export const ILLEGAL_FIELD_PROPERTY = 'configuration/mergeTypes/illegalFieldProperty';
    export const TRYING_TO_SUBTYPE_A_NON_EXTENDABLE_TYPE = 'config/fields/custom/tryingToSubtypeANonExtendableType';
    export const INCONSISTENT_TYPE_FAMILY = 'config/fields/custom/inconsistentTypeFamily';
    export const COMMON_FIELD_NOT_PROVIDED = 'config/fields/custom/commonFieldNotProvided';
}