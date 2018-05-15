import {Document, NewDocument, ProjectConfiguration} from 'idai-components-2/core';
import {ImportStrategy} from './import-strategy';
import {DocumentDatastore} from "../datastore/document-datastore";
import {Validator} from '../model/validator';

/**
 * @author Daniel de Oliveira
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

        console.log("import with meninx find import strategy");
        // await this.validator.validate(document as Document); // will throw identifier conflict if document exists

        // find the id of the stratigraphical unit (lies Within)

        try {
            const liesWithinResource = await this.datastore.get(document.resource.relations['liesWithin'][0]);
            document.resource.relations['liesWithin'][0] = liesWithinResource.resource.id;
        } catch (err) {
            console.log("liesWithin err", err);
            // TODO throw error
        }

        // TODO find the id of the operation type resource

        let exists = false;
        try {
            const existing = await this.datastore.find({q: document.resource.identifier});
            console.log("existing", existing);

            // TODO merge existing properties and new document into one
            // TODO map fields of csv into existin document
            if (existing.documents.length > 0) {
                exists = true;
            }
        } catch (err) {}

        console.log("will " + exists ? ' update' : 'create',document);

        return exists
            ? await this.datastore.update(document as Document, this.username)
            : await this.datastore.create(document, this.username);
    }
}