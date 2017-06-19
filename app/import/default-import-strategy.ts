import {Document} from 'idai-components-2/core';
import {Validator} from 'idai-components-2/persist';
import {Datastore} from 'idai-components-2/datastore';
import {ImportStrategy} from './import-strategy';
import {SettingsService} from '../settings/settings-service';

/**
 * @author Daniel de Oliveira
 */
export class DefaultImportStrategy implements ImportStrategy {

    constructor(private validator: Validator, private datastore: Datastore,
                private settingsService: SettingsService) { }

    importDoc(doc: Document): Promise<any> {

        doc.created = { user: this.settingsService.getUsername(), date: new Date() };
        doc.modified = [];

        return this.validator.validate(doc)
            .then(() => {
                return this.datastore.create(doc).catch(
                    errorWithParams => Promise.reject(errorWithParams)
                );
            })
    }
}