import {ValidationErrors} from '../../core/model/validation-errors';
import {M} from '../m';

/**
 * Converts messages of Validator / Importer to messages of M for Import component.
 *
 * @author Daniel de Oliveira
 */
export module MessagesConversion {

    export function convertMessage(msg: string[]): string[] {

        if (msg.length === 0) return [];

        let replacement = undefined;
        if (msg[0] === ValidationErrors.INVALID_TYPE) replacement = M.IMPORT_VALIDATION_ERROR_INVALIDTYPE;
        if (msg[0] === ValidationErrors.NO_ISRECORDEDIN) replacement = M.IMPORT_VALIDATION_ERROR_NORECORDEDIN;
        if (msg[0] === ValidationErrors.NO_ISRECORDEDIN_TARGET) replacement = M.IMPORT_VALIDATION_ERROR_NORECORDEDINTARGET;
        if (msg[0] === ValidationErrors.IDENTIFIER_EXISTS) replacement = M.MODEL_VALIDATION_ERROR_IDEXISTS;
        if (msg[0] === ValidationErrors.MISSING_PROPERTY) replacement = M.IMPORT_VALIDATION_ERROR_MISSINGPROPERTY;
        if (msg[0] === ValidationErrors.MISSING_GEOMETRY_TYPE) replacement = M.MODEL_VALIDATION_ERROR_MISSING_GEOMETRYTYPE;
        if (msg[0] === ValidationErrors.MISSING_COORDINATES) replacement = M.MODEL_VALIDATION_ERROR_MISSING_COORDINATES;
        if (msg[0] === ValidationErrors.INVALID_COORDINATES) replacement = M.MODEL_VALIDATION_ERROR_INVALID_COORDINATES;
        if (msg[0] === ValidationErrors.UNSUPPORTED_GEOMETRY_TYPE) replacement = M.MODEL_VALIDATION_ERROR_UNSUPPORTED_GEOMETRYTYPE;
        if (msg[0] === ValidationErrors.UNSUPPORTED_GEOMETRY_TYPE) replacement = M.MODEL_VALIDATION_ERROR_UNSUPPORTED_GEOMETRYTYPE;

        if (msg[0] === ValidationErrors.INVALID_FIELDS) {
            replacement = msg.length > 2 && msg[2].indexOf(',') !== -1
                ? M.IMPORT_VALIDATION_ERROR_INVALIDFIELDS
                : M.IMPORT_VALIDATION_ERROR_INVALIDFIELD
        }
        if (msg[0] === ValidationErrors.INVALID_RELATIONS) {
            replacement = msg.length > 2 && msg[2].indexOf(',') !== -1
                ? M.IMPORT_VALIDATION_ERROR_INVALIDRELATIONFIELDS
                : M.IMPORT_VALIDATION_ERROR_INVALIDRELATIONFIELD
        }
        if (msg[0] === ValidationErrors.INVALID_NUMERICAL_VALUES) {
            replacement = msg.length > 2 && msg[2].indexOf(',') !== -1
                ? M.IMPORT_VALIDATION_ERROR_INVALID_NUMERIC_VALUES
                : M.IMPORT_VALIDATION_ERROR_INVALID_NUMERIC_VALUE
        }

        (msg as any)[0] = replacement;
        return msg;
    }
}