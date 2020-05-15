import {Document, NewDocument} from 'idai-components-2';
import {PouchdbDatastore} from '../pouchdb/pouchdb-datastore';
import {DocumentCache} from './document-cache';
import {CachedReadDatastore} from './cached-read-datastore';
import {CategoryConverter} from './category-converter';
import {IndexFacade} from "../index/index-facade";


/**
 * Returns fully checked instances of
 * FieldDocument and ImageDocument respectively,
 * so that the rest of the app can rely that the declared
 * fields are present.
 *
 * @author Daniel de Oliveira
 * @author Sebastian Cuy
 * @author Thomas Kleinke
 */
export abstract class CachedDatastore<T extends Document> extends CachedReadDatastore<T> {

    constructor(datastore: PouchdbDatastore,
                indexFacade: IndexFacade,
                documentCache: DocumentCache<T>,
                categoryConverter: CategoryConverter<T>,
                categoryClass: string) {

        super(datastore, indexFacade, documentCache, categoryConverter, categoryClass);
    }


    /**
     * Implements {@link Datastore#create}
     *
     * @throws if document is not of category T, determined by resource.category
     * @throws if resource.category is unknown
     */
    public async create(document: NewDocument, username: string): Promise<T> {

        this.categoryConverter.assertCategoryToBeOfClass(document.resource.category, this.categoryClass);
        return this.updateIndex(await this.datastore.create(document, username));
    }


    public async bulkCreate(documents: Array<NewDocument>, username: string): Promise<Array<T>> {

        for (let document of documents) {
            this.categoryConverter.assertCategoryToBeOfClass(document.resource.category, this.categoryClass);
        }

        return (await this.datastore.bulkCreate(documents, username)).map(document => {
            return this.updateIndex(document);
        });
    }


    /**
     * Implements {@link Datastore#update}
     * @throws if document is not of category T, determined by resource.category
     */
    public async update(document: Document, username: string, squashRevisionsIds?: string[]): Promise<T> {

        this.categoryConverter.assertCategoryToBeOfClass(document.resource.category, this.categoryClass);
        return this.updateIndex(await this.datastore.update(document, username, squashRevisionsIds));
    }


    public async bulkUpdate(documents: Array<Document>, username: string): Promise<Array<T>> {

        for (let document of documents) {
            this.categoryConverter.assertCategoryToBeOfClass(document.resource.category, this.categoryClass);
        }

        return (await this.datastore.bulkUpdate(documents, username)).map(document => {
            return this.updateIndex(document);
        });
    }


    private updateIndex(document: Document) {

        const convertedDocument = this.categoryConverter.convert(document);
        this.indexFacade.put(convertedDocument);

        return !this.documentCache.get(document.resource.id as any)
            ? this.documentCache.set(convertedDocument)
            : this.documentCache.reassign(convertedDocument);
    }


    /**
     * @throws if document is not of category T, determined by resource.category
     */
    public async remove(document: Document): Promise<void> {

        this.categoryConverter.assertCategoryToBeOfClass(document.resource.category, this.categoryClass);

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
