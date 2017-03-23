import {Document} from "idai-components-2/core";
import {ImportStrategy} from "./import-strategy";
import {IdaiFieldDatastore} from "../datastore/idai-field-datastore";
import {IdaiFieldDocument} from "../model/idai-field-document";
import {M} from "../m";

/**
 * @author Daniel de Oliveira
 */
export class MergeGeometriesImportStrategy implements ImportStrategy {

    constructor(private datastore: IdaiFieldDatastore) { }

    importDoc(doc: Document): Promise<any> {
        let idaiFieldDoc = doc as IdaiFieldDocument;
        return this.datastore.findByIdentifier(idaiFieldDoc.resource.identifier)
            .then(existingIdaiFieldDoc => {
                existingIdaiFieldDoc.resource.geometry = idaiFieldDoc.resource.geometry;
                return this.datastore.update(existingIdaiFieldDoc);
            }, () => {
                return Promise.reject([M.IMPORT_FAILURE_MISSING_RESOURCE,idaiFieldDoc.resource.identifier]);
            })
    }
}