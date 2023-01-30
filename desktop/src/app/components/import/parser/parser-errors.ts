/**
 * @author Daniel de Oliveira
 * @author Thomas Kleinke
 */
export module ParserErrors {

    export const FILE_INVALID_JSON = 'importerrors/invalidjson';
    export const FILE_INVALID_JSONL = 'importerrors/invalidjsonl';
    export const INVALID_GEOJSON_IMPORT_STRUCT = 'importerrors/invalidgeojsonimportstruct';
    export const INVALID_GEOMETRY = 'importerrors/invalidgeometry';
    export const MISSING_IDENTIFIER = 'importerrors/parser/missingidentifier';
    export const MISSING_IDENTIFIER_SHAPEFILE = 'importerrors/parser/missingidentifiershapefile';
    export const ID_MUST_NOT_BE_SET = 'importerrors/parser/idnottobeset';
    export const WRONG_IDENTIFIER_FORMAT = 'importerrors/wrongidentifierformat';
    export const SHAPEFILE_GENERIC = 'importerrors/shapefile/generic';

    // CSV
    export const MANDATORY_CSV_FIELD_MISSING = 'importerrors/mandatorycsvfieldmissing';
    export const CSV_GENERIC = 'importerrors/csv/genericerror';
    export const CSV_INVALID = 'importerrors/csv/invalid';
    export const CSV_HEADING_EMPTY_ENTRY = 'parsererrors/csv/headingEmptyEntry';
    export const CSV_INVALID_HEADING = 'parsererrors/csv/invalidheading';
    export const CSV_ROW_LENGTH_MISMATCH = 'parsererrors/csv/rowLengthMismatch';
    export const CSV_HEADING_ARRAY_INDICES_INVALID_SEQUENCE = 'parsererrors/csv/csvHeadingArrayIndicesInvalidSequence';
    export const CSV_HEADING_PATH_ITEM_TYPE_MISMATCH = 'parsererrors/csv/pathItemTypeMismatch';
    export const CSV_NOT_A_NUMBER = 'importerrors/csv/notanumber'; // [error, value, column]
    export const CSV_NOT_A_BOOLEAN = 'importerrors/csvs/notaboolean';
}