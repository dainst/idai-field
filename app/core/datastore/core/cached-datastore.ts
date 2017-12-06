import {Injectable} from '@angular/core';
import {Datastore} from 'idai-components-2/datastore';
import {Document} from 'idai-components-2/core';
import {PouchdbDatastore} from './pouchdb-datastore';
import {DocumentCache} from './document-cache';
import {CachedReadDatastore} from './cached-read-datastore';
import {TypeConverter} from './type-converter';


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
        typeConverter: TypeConverter,
        typeClass: string) {

        super(datastore, documentCache, typeConverter, typeClass);
    }


    /**
     * Implements {@link Datastore#create}
     *
     * @throws if document is not of type T, determined by resource.type
     * @throws if resource.type is unknown
     */
    public async create(document: Document): Promise<T> {

        this.typeConverter.validate([document.resource.type], this.typeClass);

        const createdDocument = await this.datastore.create(document);
        return this.documentCache.set(this.typeConverter.
            convert<T>(createdDocument));
    }


    /**
     * Implements {@link Datastore#update}
     *
     * @throws if document is not of type T, determined by resource.type
     */
    public async update(document: Document): Promise<T> {

        this.typeConverter.validate([document.resource.type], this.typeClass);

        const updatedDocument = await this.datastore.update(document);

        if (!this.documentCache.get(document.resource.id as any)) {
            return this.documentCache.set(this.typeConverter.
                convert<T>(updatedDocument));
        } else {
            this.reassign(this.typeConverter.
                convert<T>(updatedDocument));
            return this.documentCache.get(document.resource.id as any);
        }
    }


    // TODO remove duplicate code
    protected reassign(doc: T) {

        if (!(doc as any)['_conflicts']) delete (this.documentCache.get(doc.resource.id as any)as any)['_conflicts'];
        Object.assign(this.documentCache.get(doc.resource.id as any), doc);
    }


    /**
     * @throws if document is not of type T, determined by resource.type
     */
    public remove(document: Document): Promise<void> {

        this.typeConverter.validate([document.resource.type], this.typeClass);

        return this.datastore.remove(document)
            .then(() => this.documentCache.remove(document.resource.id));
    }


    public removeRevision(docId: string, revisionId: string): Promise<void> {

        return this.datastore.removeRevision(docId, revisionId);
    }
}
