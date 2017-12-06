import {Injectable} from '@angular/core';
import {Datastore} from 'idai-components-2/datastore';
import {Document} from 'idai-components-2/core';
import {PouchdbDatastore} from './pouchdb-datastore';
import {DocumentCache} from './document-cache';
import {CachedReadDatastore} from './cached-read-datastore';
import {DocumentConverter} from './document-converter';


@Injectable()
/**
 * Returns fully checked instances of
 * IdaiFieldDocument and IdaiFieldImageDocument respectively,
 * so that the rest of the app can rely that the declared
 * fields are present.
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
        typeClass: string) {

        super(datastore, documentCache, documentConverter, typeClass);
    }


    /**
     * Implements {@link Datastore#create}
     *
     * @throws if document is not of type T, determined by resource.type
     * @throws if resource.type is unknown
     */
    public async create(document: Document): Promise<T> {

        this.documentConverter.validate([document.resource.type], this.typeClass);

        const createdDocument = await this.datastore.create(document);
        return this.documentCache.set(this.documentConverter.
            convertToIdaiFieldDocument<T>(createdDocument));
    }


    /**
     * Implements {@link Datastore#update}
     *
     * @throws if document is not of type T, determined by resource.type
     */
    public async update(document: Document): Promise<T> {

        this.documentConverter.validate([document.resource.type], this.typeClass);

        const updatedDocument = await this.datastore.update(document);

        if (!this.documentCache.get(document.resource.id as any)) {
            return this.documentCache.set(this.documentConverter.
                convertToIdaiFieldDocument<T>(updatedDocument));
        } else {
            this.reassign(this.documentConverter.
                convertToIdaiFieldDocument<T>(updatedDocument));
            return this.documentCache.get(document.resource.id as any);
        }
    }


    /**
     * @throws if document is not of type T, determined by resource.type
     */
    public remove(document: Document): Promise<any> { // TODO return promise undefined

        this.documentConverter.validate([document.resource.type], this.typeClass);

        return this.datastore.remove(document)
            .then(() => this.documentCache.remove(document.resource.id));
    }


    public removeRevision(docId: string, revisionId: string): Promise<any> { // TODO remove promise undefined

        return this.datastore.removeRevision(docId, revisionId);
    }
}
