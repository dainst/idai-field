import {Injectable} from "@angular/core";
import {M} from "../m";
import {ValidationInterceptor} from "idai-components-2/idai-components-2";
import {IdaiFieldDocument} from "../model/idai-field-document";

/**
 * @author Daniel de Oliveira
 */
@Injectable()
export class AppValidationInterceptor extends ValidationInterceptor {
    
    validate(doc:IdaiFieldDocument) : string {

        var resource=doc['resource'];

        if (!resource.identifier || resource.identifier.length == 0) {
            throw M.OBJLIST_IDMISSING;
        }

        doc['synced'] = 0; // TODO this is not part of the validation and should go somewhere else
        return undefined;
    }
}