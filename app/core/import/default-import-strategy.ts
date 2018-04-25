import {Document, ProjectConfiguration} from 'idai-components-2/core';
import {IdaiFieldDocument} from 'idai-components-2/field';
import {ImportStrategy} from './import-strategy';
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
                private overwriteIfExists = false,
                private mainTypeDocumentId?: string) { }


    /**
     * @throws errorWithParams
     */
    public async importDoc(
            document: Document // TODO use IdaiFieldDocument and make sure it is properly converted
        ): Promise<void> {

        if (this.mainTypeDocumentId) {
            await this.setMainTypeDocumentRelation(document, this.mainTypeDocumentId);
        }

        document.created = { user: this.username, date: new Date() };
        document.modified = [{ user: this.username, date: new Date() }];

        await this.validator.validate(document);

        let exists = true;
        try {
            await this.datastore.get(document.resource.id);
        } catch (_) {
            exists = false;
        }

        if (this.overwriteIfExists && exists) {
            await this.datastore.update(document);
        } else {
            // throws if !overwriteIfExists an exists
            await this.datastore.create(document);
        }
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