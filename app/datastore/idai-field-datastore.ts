import {IdaiFieldDocument} from "../model/idai-field-document";
import {Datastore} from "idai-components-2/datastore";
import {Observable} from "rxjs/Observable";

/**
 * The interface for datastores supporting
 * the idai-field document model.
 *
 * @author Sebastian Cuy
 */
export abstract class IdaiFieldDatastore extends Datastore {

    /**
     * @param identifier
     * @returns {Promise<Document|string>} the document with the given identifier
     */
    abstract findByIdentifier(identifier: string): Promise<IdaiFieldDocument>;

}
