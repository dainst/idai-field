/**
 * @author Daniel de Oliveira
 * @author Thomas Kleinke
 */
export module ImportErrors {

    // IO, parsing
    export const PARSER_FILE_UNREADABLE = 'importerrors/fileunreadable';
    export const PARSER_FILE_INVALID_JSON = 'importerrors/invalidjson';
    export const PARSER_FILE_INVALID_JSONL = 'importerrors/invalidjsonl';
    export const PARSER_INVALID_GEOJSON_IMPORT_STRUCT = 'importerrors/invalidgeojsonimportstruct';
    export const PARSER_CSV_INVALID = 'importerrors/csv/invalid';
    export const PARSER_CSV_GENERIC = 'importerrors/csv/genericerror';
    export const PARSER_MANDATORY_CSV_FIELD_MISSING = 'importerrors/mandatorycsvfieldmissing';
    export const PARSER_INVALID_GEOMETRY = 'importerrors/invalidgeometry';
    export const PARSER_SHAPEFILE_READ = 'importerrors/shapefile/read';
    export const PARSER_SHAPEFILE_UNSUPPORTED_GEOMETRY_TYPE = 'importerrors/shapefile/unsupportedgeometrytype';
    export const PARSER_SHAPEFILE_JSONL_WRITE = 'importerrors/shapefile/jsonlwrite';
    export const PARSER_SHAPEFILE_GENERIC = 'importerrors/shapefile/generic';
    export const PARSER_MISSING_IDENTIFIER = 'importerrors/parser/missingidentifier';
    export const PARSER_ID_MUST_NOT_BE_SET = 'importerrors/parser/idnottobeset';
    export const WRONG_IDENTIFIER_FORMAT = 'importerrors/wrongidentifierformat';

    // prevalidation - prevalidation are all the tests done before the actual db updates, except the ones done by the Validator / Validations
    export const OPERATIONS_NOT_ALLOWED = 'importerrrors/prevalidation/operationsnotallowed';
    export const NO_OPERATION_ASSIGNED = 'importerrors/prevalidation/nooperationassigned';
    export const DUPLICATE_IDENTIFIER = 'importerrors/prevalidation/duplicateidentifier';
    export const MISSING_RELATION_TARGET = 'importerrors/prevalidation/missingrelationtarget'; // by identifier

    // execution
    export const MENINX_FIND_NO_FEATURE_ASSIGNABLE = 'importerrrors/exec/meninxfind/nofeatureassignable';
    export const MENINX_NO_OPERATION_ASSIGNABLE = 'importerrrors/exec/meninxfind/nooperationassignable';
    export const ROLLBACK = 'importerrors/exec/rollback';
    export const INVALID_MAIN_TYPE_DOCUMENT = 'importerrors/invalidmaintypedocument';
    export const RESOURCE_EXISTS = 'importerrors/resourceexists'; // M.MODEL_VALIDATION_ERROR_IDENTIFIER_EXISTS
    export const EXEC_MISSING_RELATION_TARGET = 'importerrors/exec/missingrelationtarget';
}