import { Reference, validateUrl } from 'idai-field-core';
import { M } from '../../messages/m';


/**
 * @author Thomas Kleinke
 */
export function validateReferences(references: Array<Reference>) {

    references.forEach(reference => {
        if (!validateUrl(reference.uri)) throw [M.CONFIGURATION_ERROR_INVALID_REFERENCE, reference.uri];
    });
}
