import {ValidationErrors} from '../../core/model/validation-errors';
import {M} from '../m';


/**
 * @author Daniel de Oliveira
 */
export module MessagesConversion {

    export function convertMessage(msgWithParams: string[]): string[] {

        if (msgWithParams.length === 0) return [];
        let replacement = undefined;


        if (msgWithParams[0] === ValidationErrors.IDENTIFIER_EXISTS) replacement = M.MODEL_VALIDATION_ERROR_IDEXISTS;
        // TODO this gets thrown if missing identifier, probably because this is detected first
        if (msgWithParams[0] === ValidationErrors.MISSING_PROPERTY) replacement = M.IMPORT_VALIDATION_ERROR_MISSINGPROPERTY;
        // if (errorWithParams[0] === ImportErrors.MISSING_IDENTIFIER) replacement = M.IMPORT_FAILURE_MISSING_IDENTIFIER;

        // TODO replace M msg by a msg specific to docedit component
        if (msgWithParams[0] === ValidationErrors.NO_ISRECORDEDIN) replacement = M.IMPORT_VALIDATION_ERROR_NORECORDEDIN;


        if (replacement) (msgWithParams as any)[0] = replacement;
        return msgWithParams;
    }
}