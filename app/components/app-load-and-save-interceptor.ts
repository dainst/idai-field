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
        // var newO = <Entity>JSON.parse(JSON.stringify(object));

        // Replace with proper validation
        if (!object.identifier || object.identifier.length == 0) {
            throw M.OBJLIST_IDMISSING;
        }

        object['synced'] = 0; // TODO this is not part of the validation and should go somewhere else
        return object;
    }
}