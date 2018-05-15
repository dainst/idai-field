import {Document, NewDocument, ProjectConfiguration} from 'idai-components-2/core';
import {ImportStrategy} from './import-strategy';
import {DocumentDatastore} from "../datastore/document-datastore";
import {Validator} from '../model/validator';

/**
 * @author Daniel de Oliveira
 * @author Thomas Kleinke
 */
export class MeninxFindImportStrategy implements ImportStrategy {


    constructor(private validator: Validator,
                private datastore: DocumentDatastore,
                private projectConfiguration: ProjectConfiguration,
                private username: string) { }


    /**
     * @throws errorWithParams
     */
    public async importDoc(
        document: NewDocument // TODO use IdaiFieldDocument and make sure it is properly converted
    ): Promise<Document> {

        console.log("import with meninx find import strategy")
        await this.validator.validate(document as Document);

        let exists = false;
        if (document.resource.id) try {
            await this.datastore.get(document.resource.id);
            exists = true;
        } catch (_) {}

        if (exists) {
            return await this.datastore.update(document as Document, this.username);
        } else {
            // throws if !overwriteIfExists and exists
            return await this.datastore.create(document, this.username);
        }
    }
}