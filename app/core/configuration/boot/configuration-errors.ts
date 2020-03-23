/**
 * @author Daniel de Oliveira
 */
export module ConfigurationErrors {

    export const INVALID_CONFIG_DUPLICATECATEGORY = 'config/error/duplicateCategory';
    export const INVALID_CONFIG_MULTIPLEUSEOFDATING = 'config/error/multipleUseOfDating';
    export const INVALID_CONFIG_MISSINGPARENTCATEGORY = 'config/error/missingParentCategory';
    export const INVALID_CONFIG_INVALIDCATEGORY = 'config/error/invalidCategory';
    export const INVALID_CONFIG_MISSINGVALUELIST = 'config/error/missingValuelist';
    export const INVALID_CONFIG_MISSINGFIELDNAME = 'config/error/missingFieldName';
    export const INVALID_CONFIG_MISSINGRELATIONCATEGORY = 'config/error/missingRelationCategory';

    export const VALIDATION_ERROR_INVALIDINPUTTYPE = 'config/error/validationErrorInvalidInputType';

    export const INVALID_CONFIG_PARENT_NOT_DEFINED = 'config/fields/custom/parentNotDefined';
    export const INVALID_CONFIG_PARENT_NOT_TOP_LEVEL = 'config/fields/custom/parentNotATopLevel';

    export const TRYING_TO_SUBTYPE_A_NON_EXTENDABLE_CATEGORY = 'config/fields/custom/tryingToSubtypeANonExtendableCategory';
    export const INCONSISTENT_CATEGORY_NAME = 'config/fields/custom/inconsistentCategoryName';
    export const COMMON_FIELD_NOT_PROVIDED = 'config/fields/custom/commonFieldNotProvided';

    // buildProjectCategories
    export const DUPLICATION_IN_SELECTION = 'configuration/buildProjectCategories/duplicationInSelection';
    export const MUST_HAVE_PARENT = 'configuration/buildProjectCategories/mustHaveParent';
    export const MUST_HAVE_CATEGORY_NAME = 'configuration/buildProjectCategories/mustHaveCategoryName';
    export const MISSING_CATEGORY_PROPERTY = 'configuration/buildProjectCategories/missingCategoryProperty';
    export const ILLEGAL_CATEGORY_PROPERTY = 'configuration/buildProjectCategories/illegalCategoryProperty';
    export const MISSING_VALUELIST_PROPERTY = 'configuration/buildProjectCategories/missingValuelistProperty';
    export const MISSING_FIELD_PROPERTY = 'configuration/buildProjectCategories/missingFieldProperty';
    export const MUST_NOT_SET_INPUT_TYPE = 'configuration/buildProjectCategories/mustNotSetInputType';
    export const ILLEGAL_FIELD_INPUT_TYPE = 'configuration/buildProjectCategories/illegalFieldType';
    export const ILLEGAL_FIELD_PROPERTY = 'configuration/buildProjectCategories/illegalFieldProperty';
}