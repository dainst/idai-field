import { SemanticReference, validateUrl } from 'idai-field-core';
import { M } from '../../messages/m';


/**
 * @author Thomas Kleinke
 */
export function validateReferences(references: string[]) {

    references.forEach(reference => {
        if (!validateUrl(reference)) throw [M.CONFIGURATION_ERROR_INVALID_REFERENCE, reference];
    });
}


export function validateSemanticReferences(references: Array<SemanticReference>) {

    references.forEach(reference => {
        if (!validateUrl(reference.uri)) throw [M.CONFIGURATION_ERROR_INVALID_REFERENCE, reference.uri];
    });
}
