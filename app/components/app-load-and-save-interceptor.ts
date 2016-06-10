import {Injectable} from "@angular/core";
import {M} from "../m";
import {LoadAndSaveInterceptor} from "idai-components-2/idai-components-2";
import {Entity} from "idai-components-2/idai-components-2";

/**
 * @author Daniel de Oliveira
 */
@Injectable()
export class AppLoadAndSaveInterceptor extends LoadAndSaveInterceptor {

    interceptLoad(object:Entity) : Entity {
        return object;
    }

    interceptSave(object:Entity) : Entity {
        var newO = <Entity>JSON.parse(JSON.stringify(object));

        // Replace with proper validation
        if (!newO.identifier || newO.identifier.length == 0) {
            throw M.OBJLIST_IDMISSING;
        }

        newO['synced'] = 0;
        return newO;
    }
}