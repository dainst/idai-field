import {isArray} from 'tsfun';
import {ValidationErrors} from '../../core/model/validation-errors';
import {M} from '../m';
import {ImportErrors} from '../../core/import/import-errors';


/**
 * Converts messages of Validator / Importer to messages of M for ImportComponent.
 *
 * @author Daniel de Oliveira
 */
export module MessagesConversion {

    export function convertMessage(msgWithParams: string[]): string[] {

        if (!isArray(msgWithParams)) {
            console.warn('convertMessage. arg not of type array', msgWithParams);
            return [];
        }

        if (msgWithParams.length === 0) return [];
        let replacement = undefined;
        const msg = msgWithParams[0];

        // validation errors - done during import but coming from model package (validator/validations)
        if (msg === ValidationErrors.INVALID_TYPE) replacement = M.IMPORT_VALIDATION_INVALID_TYPE;
        if (msg === ValidationErrors.NO_ISRECORDEDIN) replacement = M.IMPORT_VALIDATION_ERROR_NO_RECORDEDIN;
        if (msg === ValidationErrors.NO_ISRECORDEDIN_TARGET) replacement = M.IMPORT_VALIDATION_ERROR_NO_RECORDEDIN_TARGET;
        if (msg === ValidationErrors.IDENTIFIER_ALREADY_EXISTS) replacement = M.MODEL_VALIDATION_IDENTIFIER_ALREADY_EXISTS;
        if (msg === ValidationErrors.MISSING_PROPERTY) replacement = M.IMPORT_VALIDATION_MISSING_PROPERTY;
        if (msg === ValidationErrors.MISSING_GEOMETRY_TYPE) replacement = M.MODEL_VALIDATION_MISSING_GEOMETRYTYPE;
        if (msg === ValidationErrors.MISSING_COORDINATES) replacement = M.MODEL_VALIDATION_MISSING_COORDINATES;
        if (msg === ValidationErrors.INVALID_COORDINATES) replacement = M.MODEL_VALIDATION_INVALID_COORDINATES;
        if (msg === ValidationErrors.UNSUPPORTED_GEOMETRY_TYPE) replacement = M.MODEL_VALIDATION_UNSUPPORTED_GEOMETRY_TYPE;
        if (msg === ValidationErrors.GENERIC_DATASTORE) replacement = M.IMPORT_GENERIC_DATASTORE;

        // import errors - IO, parsing
        if (msg === ImportErrors.PARSER_FILE_UNREADABLE) replacement = M.IMPORT_FILE_UNREADABLE;
        if (msg === ImportErrors.PARSER_FILE_INVALID_JSON) replacement = M.IMPORT_INVALID_JSON;
        if (msg === ImportErrors.PARSER_FILE_INVALID_JSONL) replacement = M.IMPORT_INVALID_JSONL;
        if (msg === ImportErrors.PARSER_SHAPEFILE_READ) replacement = M.IMPORT_SHAPEFILE_READ_ERROR;
        if (msg === ImportErrors.PARSER_SHAPEFILE_UNSUPPORTED_GEOMETRY_TYPE) replacement = M.IMPORT_SHAPEFILE_UNSUPPORTED_GEOMETRY_TYPE;
        if (msg === ImportErrors.PARSER_SHAPEFILE_JSONL_WRITE) replacement = M.IMPORT_SHAPEFILE_JSONL_WRITE;
        if (msg === ImportErrors.PARSER_SHAPEFILE_GENERIC) replacement = M.IMPORT_SHAPEFILE_GENERIC;
        if (msg === ImportErrors.PARSER_CSV_INVALID) replacement = M.IMPORT_INVALID_CSV;
        if (msg === ImportErrors.PARSER_CSV_GENERIC) replacement = M.IMPORT_GENERIC_CSV_ERROR;
        if (msg === ImportErrors.PARSER_MANDATORY_CSV_FIELD_MISSING) replacement = M.IMPORT_MANDATORY_CSV_FIELD_MISSING;
        if (msg === ImportErrors.PARSER_INVALID_GEOJSON_IMPORT_STRUCT) replacement = M.IMPORT_INVALID_GEOJSON_IMPORT_STRUCT;
        if (msg === ImportErrors.PARSER_INVALID_GEOMETRY) replacement = M.IMPORT_INVALID_GEOMETRY;
        if (msg === ImportErrors.PARSER_MISSING_IDENTIFIER) replacement = M.IMPORT_MISSING_IDENTIFIER;
        if (msg === ImportErrors.PARSER_ID_MUST_NOT_BE_SET) replacement = M.IMPORT_PARSING_ID_MUST_NOT_BE_SET;

        // import errors - validation not done by validator, execution of import
        if (msg === ImportErrors.WRONG_IDENTIFIER_FORMAT) replacement = M.IMPORT_IDENTIFIER_FORMAT;
        if (msg === ImportErrors.OPERATIONS_NOT_ALLOWED) replacement = M.IMPORT_PREVALIDATION_OPERATIONS_NOT_ALLOWED;
        if (msg === ImportErrors.NO_OPERATION_ASSIGNED) replacement = M.IMPORT_PREVALIDATION_NO_OPERATION_ASSIGNED;
        if (msg === ImportErrors.DUPLICATE_IDENTIFIER) replacement = M.IMPORT_PREVALIDATION_DUPLICATE_IDENTIFIER;
        if (msg === ImportErrors.MISSING_RELATION_TARGET) replacement = M.IMPORT_PREVALIDATION_MISSING_RELATION_TARGET;
        if (msg === ImportErrors.MENINX_NO_OPERATION_ASSIGNABLE) replacement = M.IMPORT_NO_OPERATION_ASSIGNABLE;
        if (msg === ImportErrors.MENINX_FIND_NO_FEATURE_ASSIGNABLE) replacement = M.IMPORT_NO_FEATURE_ASSIGNABLE;
        if (msg === ImportErrors.RESOURCE_EXISTS) replacement = M.MODEL_VALIDATION_IDENTIFIER_ALREADY_EXISTS;
        if (msg === ImportErrors.EXEC_MISSING_RELATION_TARGET) replacement = M.IMPORT_EXEC_MISSING_RELATION_TARGET;
        if (msg === ImportErrors.INVALID_MAIN_TYPE_DOCUMENT) replacement = M.IMPORT_INVALID_OPERATION_RESOURCE;
        if (msg === ImportErrors.ROLLBACK) replacement = M.IMPORT_ROLLBACK;


        if (msg === ValidationErrors.INVALID_FIELDS) {
            replacement = msgWithParams.length > 2 && msgWithParams[2].indexOf(',') !== -1
                ? M.IMPORT_VALIDATION_ERROR_INVALID_FIELDS
                : M.IMPORT_VALIDATION_ERROR_INVALID_FIELD
        }
        if (msg === ValidationErrors.INVALID_RELATIONS) {
            replacement = msgWithParams.length > 2 && msgWithParams[2].indexOf(',') !== -1
                ? M.IMPORT_VALIDATION_ERROR_INVALID_RELATION_FIELDS
                : M.IMPORT_VALIDATION_ERROR_INVALID_RELATION_FIELD
        }
        if (msg === ValidationErrors.INVALID_NUMERICAL_VALUES) {
            replacement = msgWithParams.length > 2 && msgWithParams[2].indexOf(',') !== -1
                ? M.IMPORT_VALIDATION_ERROR_INVALID_NUMERIC_VALUES
                : M.IMPORT_VALIDATION_ERROR_INVALID_NUMERIC_VALUE
        }

        if (replacement) msgWithParams[0] = replacement;

        return msgWithParams;
    }
}