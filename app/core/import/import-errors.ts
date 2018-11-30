/**
 * @author Daniel de Oliveira
 * @author Thomas Kleinke
 */
export module ImportErrors {

    // IO, parsing
    export const FILE_UNREADABLE = 'importerrors/fileunreadable';
    export const FILE_INVALID_JSON = 'importerrors/invalidjson';
    export const FILE_INVALID_JSONL = 'importerrors/invalidjsonl';
    export const INVALID_GEOJSON_IMPORT_STRUCT = 'importerrors/invalidgeojsonimportstruct';
    export const CSV_INVALID = 'importerrors/csv/invalid';
    export const CSV_GENERIC = 'importerrors/csv/genericerror';
    export const MANDATORY_CSV_FIELD_MISSING = 'importerrors/mandatorycsvfieldmissing';
    export const INVALID_GEOMETRY = 'importerrors/invalidgeometry';
    export const SHAPEFILE_READ = 'importerrors/shapefile/read';
    export const SHAPEFILE_UNSUPPORTED_GEOMETRY_TYPE = 'importerrors/shapefile/unsupportedgeometrytype';
    export const SHAPEFILE_JSONL_WRITE = 'importerrors/shapefile/jsonlwrite';
    export const SHAPEFILE_GENERIC = 'importerrors/shapefile/generic';
    export const MISSING_IDENTIFIER = 'importerrors/missingidentifier';
    export const MISSING_RESOURCE = 'importerrors/missingresource';
    export const WRONG_IDENTIFIER_FORMAT = 'importerrors/wrongidentifierformat';

    // prevalidation
    export const PREVALIDATION_INVALID_TYPE = 'importerrors/prevalidation/invalidtype';
    export const PREVALIDATION_OPERATIONS_NOT_ALLOWED = 'importerrrors/prevalidation/operationsnotallowed';
    export const PREVALIDATION_NO_OPERATION_ASSIGNED = 'importerrors/prevalidation/nooperationassigned';

    // execution
    export const EXEC_MENINX_FIND_NO_FEATURE_ASSIGNABLE = 'importerrrors/exec/meninxfind/nofeatureassignable';
    export const EXEC_MENINX_NO_OPERATION_ASSIGNABLE = 'importerrrors/exec/meninxfind/nooperationassignable';
    export const EXEC_MISSING_RELATION_TARGET = 'importerrors/exec/missingrelationtarget';
    export const EXEC_GENERIC_DATASTORE = 'importerrors/exec/genericdatastore'; // TODO seems to be unused
    export const EXEC_ROLLBACK = 'importerrors/exec/rollback';
    export const INVALID_MAIN_TYPE_DOCUMENT = 'importerrors/invalidmaintypedocument';
    export const RESOURCE_EXISTS = 'importerrors/resourceexists'; // M.MODEL_VALIDATION_ERROR_IDENTIFIER_EXISTS
}