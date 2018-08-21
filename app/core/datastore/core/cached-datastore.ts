import {Injectable} from '@angular/core';
import {Datastore} from 'idai-components-2';
import {Document, NewDocument} from 'idai-components-2';
import {PouchdbDatastore} from './pouchdb-datastore';
import {DocumentCache} from './document-cache';
import {CachedReadDatastore} from './cached-read-datastore';
import {TypeConverter} from './type-converter';
import {IndexFacade} from "../index/index-facade";


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
        indexFacade: IndexFacade,
        documentCache: DocumentCache<T>,
        typeConverter: TypeConverter<T>,
        typeClass: string) {

        super(datastore, indexFacade, documentCache, typeConverter, typeClass);
    }


    /**
     * Implements {@link Datastore#create}
     *
     * @throws if document is not of type T, determined by resource.type
     * @throws if resource.type is unknown
     */
    public async create(document: NewDocument, username: string): Promise<T> {

        this.typeConverter.validateTypeToBeOfClass(document.resource.type, this.typeClass);
        return this.updateIndex(await this.datastore.create(document, username));
    }


    /**
     * Implements {@link Datastore#update}
     * @throws if document is not of type T, determined by resource.type
     */
    public async update(document: Document, username: string, squashRevisionsIds?: string[]): Promise<T> {

        this.typeConverter.validateTypeToBeOfClass(document.resource.type, this.typeClass);
        return this.updateIndex(await this.datastore.update(document, username, squashRevisionsIds));
    }


    private updateIndex(document: Document) {

        this.indexFacade.put(document);
        const convertedDocument = this.typeConverter.convert(document);
        return !this.documentCache.get(document.resource.id as any)
            ? this.documentCache.set(convertedDocument)
            : this.documentCache.reassign(convertedDocument);
    }


    /**
     * @throws if document is not of type T, determined by resource.type
     */
    public async remove(document: Document): Promise<void> {

        this.typeConverter.validateTypeToBeOfClass(document.resource.type, this.typeClass);

        // we want the doc removed from the indices asap,
        // in order to not risk someone finding it still with findIds due to
        // issues that are theoretically possible because we cannot know
        // when .on('change' (pouchdbdatastore) fires. so we do remove it here,
        // although we know it will be done again for the same doc
        // in .on('change'
        this.indexFacade.remove(document);

        await this.datastore.remove(document);
        this.documentCache.remove(document.resource.id);
    }
}
