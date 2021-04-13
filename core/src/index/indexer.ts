import { isUndefined, not } from 'tsfun';
import { IndexFacade } from '.';
import { Converter, DocumentCache } from '../datastore';
import { Document } from '../model/document';


/**
 * @author Daniel de Oliveira
 * @author Thomas Kleinke
 * @author Sebastian Cuy
 */
 export module Indexer {
 
    export async function reindex(indexFacade: IndexFacade, db: PouchDB.Database,
            documentCache: DocumentCache, converter: Converter,
            setIndexedDocuments?: (count: number) => Promise<void>,
            setIndexing?: () => Promise<void>,
            setError?: (error: string) => Promise<void>) {

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
            documents = convertDocuments(documents, converter);
            documents.forEach(doc => documentCache.set(doc));
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


    function convertDocuments(documents: Array<Document>, converter: Converter): Array<Document> {

        return documents.map(doc => {
            try {
                return converter.convert(doc);
            } catch (err) {
                if (err.length > 0) {
                    console.warn('Error while converting document: ', err);
                    return undefined;
                }
            }
        }).filter(not(isUndefined));
    }


    const isDesignDoc = (row: any) => row.id.indexOf('_') === 0;

}
