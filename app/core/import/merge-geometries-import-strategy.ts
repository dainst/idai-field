import {Document} from 'idai-components-2';
import {IdaiFieldDocument} from 'idai-components-2';
import {ImportStrategy} from './import-strategy';
import {M} from '../../m';
import {DocumentDatastore} from "../datastore/document-datastore";
import {Validator} from '../model/validator';
import {clone} from '../../util/object-util';

/**
 * @author Daniel de Oliveira
 * @author Thomas Kleinke
 */
export class MergeGeometriesImportStrategy implements ImportStrategy {

    constructor(private validator: Validator,
                private datastore: DocumentDatastore,
                private username: string) { }


    importDoc(doc: Document): Promise<any> {

        let document: IdaiFieldDocument = doc as IdaiFieldDocument;
        let existingDocument: IdaiFieldDocument;

        return this.datastore.find({
                constraints: {
                    'identifier:match' : document.resource.identifier
                }
            }).then(result => {
                if (result.totalCount > 0) {
                    existingDocument = result.documents[0] as IdaiFieldDocument;
                } else {
                    return Promise.reject([M.IMPORT_FAILURE_MISSING_RESOURCE, document.resource.identifier]);
                }

                existingDocument.resource.geometry = document.resource.geometry;

                if (!existingDocument.modified) existingDocument.modified = [];
                existingDocument.modified.push({ user: this.username, date: new Date() });

                const docToValidate = clone(existingDocument);
                if (docToValidate.resource.relations.isRecordedIn // empty isRecordedIn on operation subtype documents leads to validation error
                    && docToValidate.resource.relations.isRecordedIn.length === 0) {

                    delete docToValidate.resource.relations.isRecordedIn;
                }
                return this.validator.validate(docToValidate);
            }, () => {
                return Promise.reject([M.ALL_FIND_ERROR]);
            }).then(() => this.datastore.update(existingDocument, this.username),
                msgWithParams => Promise.reject(msgWithParams));
    }
}