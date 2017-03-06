import {Injectable} from "@angular/core";
import {Document} from "idai-components-2/core";
import {ImportStrategy} from "./import-strategy";
import {IdaiFieldDatastore} from "../datastore/idai-field-datastore";
import {IdaiFieldDocument} from "../model/idai-field-document";

@Injectable()
/**
 * @author Daniel de Oliveira
 */
export class MergeGeometriesImportStrategy implements ImportStrategy {

    constructor(
                private datastore: IdaiFieldDatastore)  // TODO check this. this is strange, i can define the type here, but on the caller i just pass a regular datastore, so this a call to findByIdentifier would fail
    { }

    importDoc(doc: Document): Promise<any> {
        let idaiFieldDoc = doc as IdaiFieldDocument;
        return this.datastore.findByIdentifier(idaiFieldDoc.resource.identifier)
            .then(existingIdaiFieldDoc => {
                existingIdaiFieldDoc.resource.geometries = idaiFieldDoc.resource.geometries;
                return this.datastore.update(existingIdaiFieldDoc);
            }, keyOfM => {
                return Promise.reject([keyOfM]);
            })
    }
}