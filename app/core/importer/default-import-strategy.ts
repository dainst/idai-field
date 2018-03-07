import {Document} from 'idai-components-2/core';
import {ProjectConfiguration} from 'idai-components-2/core';
import {ImportStrategy} from './import-strategy';
import {SettingsService} from '../settings/settings-service';
import {M} from '../../m';
import {DocumentDatastore} from "../datastore/document-datastore";
import {Validator} from '../model/validator';

/**
 * @author Daniel de Oliveira
 * @author Thomas Kleinke
 */
export class DefaultImportStrategy implements ImportStrategy {


    constructor(private validator: Validator, private datastore: DocumentDatastore, private settingsService: SettingsService,
                private projectConfiguration: ProjectConfiguration, private mainTypeDocumentId?: string) { }


    importDoc(document: Document): Promise<any> {

        return this.setMainTypeDocumentRelation(document)
            .then(() => {
                document.created = { user: this.settingsService.getUsername(), date: new Date() };
                document.modified = [{ user: this.settingsService.getUsername(), date: new Date() }];

                return this.validator.validate(document);
            })
            .then(() => this.datastore.create(document))
            .catch(
                errorWithParams => Promise.reject(errorWithParams)
            );
    }


    private setMainTypeDocumentRelation(document: Document): Promise<any> {

        if (!this.mainTypeDocumentId || this.mainTypeDocumentId == '') return Promise.resolve();

        return this.datastore.get(this.mainTypeDocumentId as any)
            .then((mainTypeDocument: any) => {
                if (!this.projectConfiguration.isAllowedRelationDomainType(document.resource.type,
                        mainTypeDocument.resource.type, 'isRecordedIn')) {
                    return Promise.reject([M.IMPORT_FAILURE_INVALID_MAIN_TYPE_DOCUMENT, document.resource.type,
                        mainTypeDocument.resource.type]);
                }

                let relations = document.resource.relations;

                if (!relations['isRecordedIn']) relations['isRecordedIn'] = [];

                if (relations['isRecordedIn'].indexOf(this.mainTypeDocumentId as any) == -1) {
                    relations['isRecordedIn'].push(this.mainTypeDocumentId as any);
                }

                return Promise.resolve();
        });
    }
}