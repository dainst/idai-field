import {ValidationErrors} from '../../core/model/validation-errors';
import {M} from '../m';


/**
 * * Converts messages of Validator to messages of M for DoceditComponent.
 *
 * @author Daniel de Oliveira
 */
export module MessagesConversion {

    export function convertMessage(msgWithParams: string[]): string[] {

        if (msgWithParams.length === 0) return [];
        let replacement = undefined;
        const msg = msgWithParams[0];

        if (msg === ValidationErrors.NO_ISRECORDEDIN) replacement = M.DOCEDIT_VALIDATION_ERROR_NO_RECORDEDIN;
        if (msg === ValidationErrors.NO_ISRECORDEDIN_TARGET) replacement = M.DOCEDIT_VALIDATION_ERROR_NO_RECORDEDIN_TARGET;
        if (msg === ValidationErrors.IDENTIFIER_EXISTS) replacement = M.MODEL_VALIDATION_ERROR_IDENTIFIER_EXISTS;
        if (msg === ValidationErrors.MISSING_PROPERTY) replacement = M.DOCEDIT_VALIDATION_ERROR_MISSING_PROPERTY;

        if (msg === ValidationErrors.INVALID_NUMERICAL_VALUES) {
            replacement = msgWithParams.length > 2 && msgWithParams[2].indexOf(',') !== -1
                ? M.DOCEDIT_VALIDATION_ERROR_INVALID_NUMERIC_VALUES
                : M.DOCEDIT_VALIDATION_ERROR_INVALID_NUMERIC_VALUE
        }

        if (replacement) (msgWithParams as any)[0] = replacement;
        return msgWithParams;
    }
}