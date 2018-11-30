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
    export const INVALID_CSV = 'importerrors/invalidcsv';
    export const GENERIC_CSV_ERROR = 'importerrors/genericcsverror';
    export const MANDATORY_CSV_FIELD_MISSING = 'importerrors/mandatorycsvfieldmissing';
    export const SHAPEFILE_READ_ERROR = 'importerrors/shapefilereaderror';
    export const SHAPEFILE_UNSUPPORTED_GEOMETRY_TYPE = 'importerrors/shapefileunsupportedgeometrytype';
    export const SHAPEFILE_JSONL_WRITE_ERROR = 'importerrors/shapefilejsonlwriteerror';
    export const SHAPEFILE_GENERIC_ERROR = 'importerrors/shapefilegenericerror';
    export const INVALID_GEOMETRY = 'importerrors/invalidgeometry';

    // structure of resources
    export const WRONG_IDENTIFIER_FORMAT = 'importerrors/wrongidentifierformat';
    export const MISSING_RESOURCE = 'importerrors/missingresource';

    // content, structure of whole import
    export const MISSING_IDENTIFIER = 'importerrors/missingidentifier';
    export const OPERATIONS_NOT_ALLOWED = 'importerrrors/operationsnotallowedonimportoperation';
    export const NO_OPERATION_ASSIGNED = 'importerrors/onlyplaceandoperationswithoutrecordedinallowed';
    export const NO_OPERATION_ASSIGNABLE = 'importerrrors/nooperationassignable';
    export const NO_FEATURE_ASSIGNABLE = 'importerrrors/nofeatureassignable';

    // other, execution of import
    export const INVALID_MAIN_TYPE_DOCUMENT = 'importerrors/invalidmaintypedocument';
    export const MISSING_RELATION_TARGET = 'importerrors/missingrelationtarget';
    export const GENERIC_DATASTORE_ERROR = 'importerrors/genericdatastoreerror'; // TODO seems to be unused
    export const ROLLBACK_ERROR = 'importerrors/rollbackerror';
    export const RESOURCE_EXISTS = 'importerrors/resourceexists'; // M.MODEL_VALIDATION_ERROR_IDENTIFIER_EXISTS
}