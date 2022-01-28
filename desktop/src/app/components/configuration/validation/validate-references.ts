import { M } from '../../messages/m';


const urlRegex =
    /^https?:\/\/(www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_\+.~#?&//=]*)$/;


/**
 * @author Thomas Kleinke
 */
export function validateReferences(references?: string[]) {

    if (!references) return;

    references.forEach(reference => {
        const result = reference.match(urlRegex);
        if (!result || result[0] !== reference) {
            throw [M.CONFIGURATION_ERROR_INVALID_REFERENCE, reference];
        }
    })
}
