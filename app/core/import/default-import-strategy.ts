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


    constructor(private validator: Validator,
                private datastore: DocumentDatastore,
                private projectConfiguration: ProjectConfiguration,
                private username: string,
                private mainTypeDocumentId?: string) { }


    /**
     * @throws errorWithParams
     */
    public async importDoc(document: Document): Promise<void> {

        if (this.mainTypeDocumentId) {
            await this.setMainTypeDocumentRelation(document, this.mainTypeDocumentId);
        }

        document.created = { user: this.username, date: new Date() };
        document.modified = [{ user: this.username, date: new Date() }];

        await this.validator.validate(document);
        await this.datastore.create(document);
    }


    private async setMainTypeDocumentRelation(document: Document, mainTypeDocumentId: string): Promise<void> {

        const mainTypeDocument = await this.datastore.get(mainTypeDocumentId);

        if (!this.projectConfiguration.isAllowedRelationDomainType(document.resource.type,
                mainTypeDocument.resource.type, 'isRecordedIn')) {

            throw [M.IMPORT_FAILURE_INVALID_MAIN_TYPE_DOCUMENT, document.resource.type,
                mainTypeDocument.resource.type];
        }

        const relations = document.resource.relations;
        if (!relations['isRecordedIn']) relations['isRecordedIn'] = [];
        if (!relations['isRecordedIn'].includes(mainTypeDocumentId)) {
            relations['isRecordedIn'].push(mainTypeDocumentId);
        }
    }
}