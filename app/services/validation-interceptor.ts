import {Injectable} from "@angular/core";
import {M} from "../m";
import {IdaiFieldDocument} from "../model/idai-field-document";

/**
 * @author Daniel de Oliveira
 */
@Injectable()
export class ValidationInterceptor {

    /**
     * @param doc
     * @returns {string} the error as key of m, <code>undefined</code> if no errors.
     */
    validate(doc:IdaiFieldDocument) : string {

        var resource=doc['resource'];

        if (!resource.identifier || resource.identifier.length == 0) {
            return M.OBJLIST_IDMISSING;
        }
        
        return undefined;
    }
}