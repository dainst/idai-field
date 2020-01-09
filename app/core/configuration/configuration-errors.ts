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

    // buildProjectTypes
    export const DUPLICATION_IN_SELECTION = 'configuration/buildProjectTypes/duplicationinselection';
    export const MUST_HAVE_PARENT = 'configuration/buildProjectTypes/musthaveparent';
    export const MUST_HAVE_TYPE_FAMILY = 'configuration/buildProjectTypes/musthavetypefamily';
    export const MISSING_TYPE_PROPERTY = 'configuration/buildProjectTypes/missingTypeProperty';
    export const ILLEGAL_TYPE_PROPERTY = 'configuration/buildProjectTypes/illegalTypeProperty';
    export const MISSING_VALUELIST_PROPERTY = 'configuration/buildProjectTypes/missingValuelistProperty';
    export const MISSING_FIELD_PROPERTY = 'configuration/buildProjectTypes/missingFieldProperty';
    export const MUST_NOT_SET_INPUT_TYPE = 'configuration/buildProjectTypes/mustNotSetInputType';
    export const ILLEGAL_FIELD_INPUT_TYPE = 'configuration/buildProjectTypes/illegalFieldType';
    export const ILLEGAL_FIELD_PROPERTY = 'configuration/buildProjectTypes/illegalFieldProperty';
    export const TRYING_TO_SUBTYPE_A_NON_EXTENDABLE_TYPE = 'config/fields/custom/tryingToSubtypeANonExtendableType';
    export const INCONSISTENT_TYPE_FAMILY = 'config/fields/custom/inconsistentTypeFamily';
    export const COMMON_FIELD_NOT_PROVIDED = 'config/fields/custom/commonFieldNotProvided';
}