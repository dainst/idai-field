import {Document} from 'idai-components-2/core';
import {IdaiFieldDocument} from 'idai-components-2/idai-field-model';
import {Validator} from 'idai-components-2/persist';
import {ImportStrategy} from './import-strategy';
import {SettingsService} from '../settings/settings-service';
import {M} from '../../m';
import {DocumentDatastore} from "../datastore/document-datastore";

/**
 * @author Daniel de Oliveira
 * @author Thomas Kleinke
 */
export class MergeGeometriesImportStrategy implements ImportStrategy {

    constructor(private validator: Validator,
                private datastore: DocumentDatastore,
                private settingsService: SettingsService) { }


    importDoc(doc: Document): Promise<any> {

        let document: IdaiFieldDocument = doc as IdaiFieldDocument;
        let existingDocument: IdaiFieldDocument;

        return this.datastore.find({
                constraints: {
                    'resource.identifier' : document.resource.identifier
                }
            }).then(result => {
                if (result.totalCount > 0) {
                    existingDocument = result.documents[0] as IdaiFieldDocument;
                } else {
                    return Promise.reject([M.IMPORT_FAILURE_MISSING_RESOURCE, document.resource.identifier]);
                }

                existingDocument.resource.geometry = document.resource.geometry;

                if (!existingDocument.modified) existingDocument.modified = [];
                existingDocument.modified.push({ user: this.settingsService.getUsername(), date: new Date() });

                return this.validator.validate(existingDocument);
            }, () => {
                return Promise.reject([M.ALL_FIND_ERROR]);
            }).then(() => this.datastore.update(existingDocument),
                msgWithParams => Promise.reject(msgWithParams));
    }
}