import {Document} from 'idai-components-2/core';
import {IdaiFieldDocument} from 'idai-components-2/idai-field-model';
import {ImportStrategy} from './import-strategy';
import {IdaiFieldDatastore} from '../datastore/idai-field-datastore';
import {SettingsService} from '../settings/settings-service';
import {M} from '../m';

/**
 * @author Daniel de Oliveira
 */
export class MergeGeometriesImportStrategy implements ImportStrategy {

    constructor(
        private datastore: IdaiFieldDatastore,
        private settingsService: SettingsService) { }

    importDoc(doc: Document): Promise<any> {
        let idaiFieldDoc = doc as IdaiFieldDocument;


        return this.datastore.find({
                q: '',
                prefix: true,
                constraints: {
                    'resource.identifier' : idaiFieldDoc.resource.identifier
                }
            })
            .then(existingIdaiFieldDocs => {
                let existingIdaiFieldDoc;
                if (existingIdaiFieldDocs.length > 0) {
                    existingIdaiFieldDoc = existingIdaiFieldDocs[0];
                } else {
                    return Promise.reject([M.IMPORT_FAILURE_MISSING_RESOURCE,idaiFieldDoc.resource.identifier]);
                }

                existingIdaiFieldDoc.resource.geometry = idaiFieldDoc.resource.geometry;

                if (!existingIdaiFieldDoc.modified) existingIdaiFieldDoc.modified = [];
                existingIdaiFieldDoc.modified.push({ user: this.settingsService.getUsername(), date: new Date() });

                return this.datastore.update(existingIdaiFieldDoc);
            })
            .catch(() => {
                return Promise.reject([M.ALL_FIND_ERROR]);
            })
    }
}