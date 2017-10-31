import {Datastore} from 'idai-components-2/datastore';
import {Document} from 'idai-components-2/core';
import {Injectable} from '@angular/core';
import {PouchdbDatastore} from './pouchdb-datastore';
import {DocumentCache} from "./document-cache";
import {CachedReadDatastore} from "./cached-read-datastore";
import {DocumentConverter} from "./document-converter";


@Injectable()
/**
 * This datastore provides everything necessary
 * to power a idai-field application:
 *
 * 1) A PouchDB based datastore layer, with gives us synchronization.
 *
 * 1) A document cache for faster access and also to allow
 *    for clients to work with references to documents.
 *
 * 2) Returns fully checked instances of
 *    IdaiFieldDocument and IdaiFieldImageDocument respectively,
 *    so that the rest of the app can rely that the declared
 *    fields are present.
 *
 * @author Daniel de Oliveira
 * @author Sebastian Cuy
 * @author Thomas Kleinke
 */
export abstract class CachedDatastore<T extends Document>
    extends CachedReadDatastore<T> {


    constructor(
        datastore: PouchdbDatastore,
        documentCache: DocumentCache<T>,
        documentConverter: DocumentConverter,
        typeClassName: string) {

        super(datastore, documentCache, documentConverter, typeClassName);
    }


    /**
     * Implements {@link Datastore#create}
     *
     * @param document
     * @returns
     */
    public async create(document: Document): Promise<Document> { // TODO return T and check if it is checked in every execution path, write test

        const createdDocument = await this.datastore.create(document);
        return this.documentCache.set(this.documentConverter.
            convertToIdaiFieldDocument<T>(createdDocument));
    }


    /**
     * Implements {@link Datastore#update}
     *
     * @param document
     * @returns
     */
    public async update(document: Document): Promise<Document> { // TODO return T and check if it is checked in every execution path, write test

        const updatedDocument = await this.datastore.update(document);

        if (!this.documentCache.get(document.resource.id as any)) {

            return this.documentCache.set(this.documentConverter.
                convertToIdaiFieldDocument<T>(updatedDocument));

        } else {

            this.reassign(this.documentConverter.convertToIdaiFieldDocument<T>(
                updatedDocument));
            return this.documentCache.get(document.resource.id as any);
        }
    }


    public remove(doc: Document): Promise<any> { // TODO return promise undefined

        return this.datastore.remove(doc)
            .then(() => this.documentCache.remove(doc.resource.id));
    }


    /**
     * @param docId
     * @param revisionId
     * @returns {Promise<any>}
     */
    public removeRevision(docId: string, revisionId: string): Promise<any> { // TODO remove promise undefined

        return this.datastore.removeRevision(docId, revisionId);
    }
}
