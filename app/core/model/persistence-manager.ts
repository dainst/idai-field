import {Injectable} from '@angular/core';
import {Document, NewDocument, ProjectConfiguration, toResourceId} from 'idai-components-2/core';
import {DocumentDatastore} from '../datastore/document-datastore';
import {filter, flatMap, flow, includedIn, isNot, mapTo, on, subtract, to} from 'tsfun';
import {TypeUtility} from './type-utility';
import {ConnectedDocsWriter} from './connected-docs-writer';


// TODO make sure that when a resource is deleted which contains
// children (via liesWithin, that either they also get deleted (like for operation type documents)
// or they get moved to a higher level

// Or solve both problems (that mentioned plus when resources are moved to different operations)
// in view facade so that missing parents are ignored and items get displayed on the top level

@Injectable()
/**
 * When persisting or deleting, PersistenceManager maintains a consistent state of relations between the
 * documents by updating related documents relations.
 *
 * @author Daniel de Oliveira
 * @author Thomas Kleinke
 */
export class PersistenceManager {

    constructor(
        private datastore: DocumentDatastore,
        private projectConfiguration: ProjectConfiguration,
        private typeUtility: TypeUtility,
        private persistenceWriter: ConnectedDocsWriter
    ) {}


    /**
     * Persists document and all the objects that are or have been in relation
     * with the object before the method call.
     *
     * If the document is { resource: { id: 1, relations: { includes: [2] } } },
     * this means that also another document is updated, namely { resource: { id: 2 } } }.
     * which gets updated to { resource: { id: 2, relations: { belongsTo: [1] } } }.
     *
     * On top of that, one oldVersion and some revisionsToSquash can be specified.
     * These are compared with document to determine which relations have been removed.
     *
     * @param document an existing or a new document
     * @param username
     * @param oldVersion to be used only if document is an existing document.
     * @param revisionsToSquash these revisions get deleted while updating document
     * @returns a copy of the updated document
     * @throws msgWithParams
     */
    public async persist(
        document: NewDocument|Document,
        username: string,
        oldVersion: Document = document as Document,
        revisionsToSquash: Document[] = [],
        ): Promise<Document> {

        const persistedDocument = await this.updateWithConnections(
            document as Document, oldVersion, revisionsToSquash, username);

        await this.fixIsRecordedInInLiesWithinDocs(persistedDocument, username);
        return persistedDocument;
    }


    /**
     * Removes the document from the datastore.
     *
     * Also removes all documents with an 'isRecordedIn' relation pointing to this document.
     * Deletes all corresponding inverse relations.
     *
     * @throws
     *   [DatastoreErrors.DOCUMENT_NO_RESOURCE_ID] - if document has no resource id
     *   [DatastoreErrors.DOCUMENT_DOES_NOT_EXIST_ERROR] - if document has a resource id, but does not exist in the db
     *   [DatastoreErrors.GENERIC_DELETE_ERROR] - if cannot delete for another reason
     */
    public async remove(document: Document, username: string) {

        // don't rely on isRecordedIn alone. Make sure it is really an operation subtype
        if (this.typeUtility.isSubtype(document.resource.type, "Operation")) {
            for (let recordedInDoc of (await this.findDocsRecordedInDocs(document.resource.id))) {
                await this.removeWithConnections(recordedInDoc, username);
            }
        }
        await this.removeWithConnections(document, username);
    }


    private async updateWithConnections(document: Document,
                        oldVersion: Document,
                        revisionsToSquash: Array<Document>,
                        username: string) {

        const updated = await this.persistIt(document, username, mapTo('_rev', revisionsToSquash));

        await this.persistenceWriter.update(
            updated, [oldVersion].concat(revisionsToSquash), username);
        return updated as Document;
    }


    private async removeWithConnections(document: Document, username: string): Promise<void> {

        await this.persistenceWriter.remove(document, username);
        await this.datastore.remove(document);
        return undefined;
    }


    private async fixIsRecordedInInLiesWithinDocs(document: Document, username: string) {

        if (document.resource.relations['isRecordedIn']
            && document.resource.relations['isRecordedIn'].length > 0) {

            const allLiesWithinDocs = await this.findAllLiesWithinDocs(document.resource.id);
            const docsToCorrect = allLiesWithinDocs
                // TODO make .filter(isDefinedBy(on('...)
                .filter(doc => {
                    return (doc.resource.relations['isRecordedIn']
                        && doc.resource.relations['isRecordedIn'].length > 0)
                })
                .filter(isNot(on('resource.relations.isRecordedIn')(document)));

            for (let docToCorrect of docsToCorrect) { // TODO clone doc before saving, use jasmine object containing to test it then
                docToCorrect.resource.relations['isRecordedIn'] = document.resource.relations['isRecordedIn'];
                await this.datastore.update(docToCorrect, username, undefined);
            }
        }
    }


    private async findDocsRecordedInDocs(resourceId: string): Promise<Array<Document>> {

        return (await this.datastore.find({
            constraints: { 'isRecordedIn:contain': resourceId }
        })).documents;
    }


    private async findAllLiesWithinDocs(resourceId: string): Promise<Array<Document>> {

        let result: Array<Document> = [];

        const go = async (resourceId: string) => {

            const documents = (await this.datastore.find({
                constraints: { 'liesWithin:contain': resourceId }
            })).documents;
            result = result.concat(documents);

            for (let doc of documents) await go(doc.resource.id);
        };

        await go(resourceId);
        return result;
    }


    private persistIt(document: Document|NewDocument, username: string, squashRevisionIds: string[]): Promise<Document> {

        return document.resource.id
            ? this.datastore.update(
                document as Document,
                username,
                squashRevisionIds.length === 0 ? undefined : squashRevisionIds)
            : this.datastore.create(document, username);
    }
}
