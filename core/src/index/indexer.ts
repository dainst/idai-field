import { isUndefined, not } from 'tsfun';
import { IndexFacade } from './index-facade';
import { DocumentConverter, DocumentCache } from '../datastore';
import { Document } from '../model/document';
import { WarningsUpdater } from '../datastore/warnings-updater';
import { ProjectConfiguration } from '../services';


/**
 * @author Daniel de Oliveira
 * @author Thomas Kleinke
 * @author Sebastian Cuy
 */
 export module Indexer {
 
    export async function reindex(indexFacade: IndexFacade, db: PouchDB.Database, documentCache: DocumentCache,
                                  converter: DocumentConverter, projectConfiguration: ProjectConfiguration,
                                  keepCachedInstances: boolean, setProgress?: (progress: number) => Promise<void>,
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
                documents = documents.filter(document => !documentCache.get(document.resource?.id));
            }
            documents = convertDocuments(documents, converter);
            documents.forEach(document => {
                WarningsUpdater.updateIndexIndependentWarnings(document, projectConfiguration);
                documentCache.set(document);
            });

            if (keepCachedInstances) {
                documentCache.getAll().forEach(document => {
                    WarningsUpdater.updateIndexIndependentWarnings(document, projectConfiguration);
                });
                documents = documents.concat(documentCache.getAll());
            }

            await indexFacade.putMultiple(documents, setProgress);
            await addIndexDependentWarnings(indexFacade, documentCache, projectConfiguration, setProgress);
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

        return documents.map(document => {
            try {
                converter.convert(document);
                return document;
            } catch (err) {
                console.warn('Error while converting document: ', err);
                return undefined;
            }
        }).filter(not(isUndefined));
    }


    async function addIndexDependentWarnings(indexFacade: IndexFacade, documentCache: DocumentCache,
                                             projectConfiguration: ProjectConfiguration,
                                             setProgress?: (progress: number) => Promise<void>) {

        const documents: Array<Document> = documentCache.getAll();

        for (let i = 0; i < documents.length; i++) {
            const document: Document = documents[i];
            await WarningsUpdater.updateIndexDependentWarnings(
                document, indexFacade, documentCache, projectConfiguration
            );

            if (setProgress && (i % 250 === 0 || i === documents.length)) {
                await setProgress(documents.length * 0.75 + i * 0.25);
            }
        };
    }


    const isDesignDoc = (row: any) => row.id.indexOf('_') === 0;
}
