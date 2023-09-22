import { isUndefined, not } from 'tsfun';
import { IndexFacade } from './index-facade';
import { DocumentConverter, DatastoreErrors, DocumentCache } from '../datastore';
import { Document } from '../model/document';


/**
 * @author Daniel de Oliveira
 * @author Thomas Kleinke
 * @author Sebastian Cuy
 */
 export module Indexer {
 
    export async function reindex(indexFacade: IndexFacade, db: PouchDB.Database, documentCache: DocumentCache,
                                  converter: DocumentConverter, keepCachedInstances: boolean,
                                  setIndexedDocuments?: (count: number) => Promise<void>,
                                  setIndexing?: () => Promise<void>, setError?: (error: string) => Promise<void>) {

        indexFacade.clear();

        let documents = [];
        try {
            documents = await fetchAll(db);
        } catch (err) {
            console.error(err);
            setError && await setError('fetchDocumentsError');
            throw err;
        }

        setIndexing && await setIndexing();

        try {
            if (keepCachedInstances) {
                documents = documents.filter(document => !documentCache.get(document.resource.id));
            }
            documents = convertDocuments(documents, converter);
            documents.forEach(doc => documentCache.set(doc));

            if (keepCachedInstances) {
                documents = documents.concat(documentCache.getAll());
            }

            await indexFacade.putMultiple(documents, setIndexedDocuments);
        } catch (err) {
            console.error(err);
            setError && setError('indexingError');
            throw err;
        }
    }


    async function fetchAll(db: PouchDB.Database) {

        return (await db
            .allDocs({
                include_docs: true,
                conflicts: true
            })).rows
            .filter(row => !isDesignDoc(row))
            .map(row => row.doc);
    }


    function convertDocuments(documents: Array<Document>, converter: DocumentConverter): Array<Document> {

        return documents.map(doc => {
            try {
                return converter.convert(doc);
            } catch (err) {
                if (!err.length || err[0] !== DatastoreErrors.UNKNOWN_CATEGORY) {
                    console.warn('Error while converting document: ', err);
                }
                return undefined;
            }
        }).filter(not(isUndefined));
    }


    const isDesignDoc = (row: any) => row.id.indexOf('_') === 0;
}
