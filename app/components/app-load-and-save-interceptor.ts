import {Injectable} from "@angular/core";
import {M} from "../m";
import {LoadAndSaveInterceptor} from "idai-components-2/idai-components-2";
import {Entity} from "idai-components-2/idai-components-2";

/**
 * @author Daniel de Oliveira
 */
@Injectable()
export class AppLoadAndSaveInterceptor extends LoadAndSaveInterceptor {

    interceptLoad(object:Entity) : string {
        return undefined;
    }

    interceptSave(object:Entity) : string {

        // Replace with proper validation
        if (!object.identifier || object.identifier.length == 0) {
            return M.OBJLIST_IDMISSING;
        }

        object['synced'] = 0;

        return undefined;
    }
}