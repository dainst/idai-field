import {Injectable} from "@angular/core";
import {M} from "../m";
import {ValidationInterceptor} from "idai-components-2/idai-components-2";
import {Entity} from "idai-components-2/idai-components-2";

/**
 * @author Daniel de Oliveira
 */
@Injectable()
export class AppValidationInterceptor extends ValidationInterceptor {
    
    validate(document:Entity) : string {

        var resource=document['resource']

        if (!resource.identifier || resource.identifier.length == 0) {
            throw M.OBJLIST_IDMISSING;
        }

        document['synced'] = 0; // TODO this is not part of the validation and should go somewhere else
        return undefined;
    }
}