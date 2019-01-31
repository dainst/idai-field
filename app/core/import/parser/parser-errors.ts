/**
 * @author Daniel de Oliveira
 * @author Thomas Kleinke
 */
export module ParserErrors {

    export const FILE_INVALID_JSON = 'importerrors/invalidjson';
    export const FILE_INVALID_JSONL = 'importerrors/invalidjsonl';
    export const INVALID_GEOJSON_IMPORT_STRUCT = 'importerrors/invalidgeojsonimportstruct';
    export const CSV_INVALID = 'importerrors/csv/invalid';
    export const CSV_GENERIC = 'importerrors/csv/genericerror';
    export const MANDATORY_CSV_FIELD_MISSING = 'importerrors/mandatorycsvfieldmissing';
    export const INVALID_GEOMETRY = 'importerrors/invalidgeometry';
    export const MISSING_IDENTIFIER = 'importerrors/parser/missingidentifier';
    export const ID_MUST_NOT_BE_SET = 'importerrors/parser/idnottobeset';
    export const WRONG_IDENTIFIER_FORMAT = 'importerrors/wrongidentifierformat';
    export const SHAPEFILE_GENERIC = 'importerrors/shapefile/generic';
}