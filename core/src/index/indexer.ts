import { isUndefined, not } from 'tsfun';
import { IndexFacade } from './index-facade';
import { DocumentCache, Migrator } from '../datastore';
import { Document } from '../model/document/document';
import { WarningsUpdater } from '../warnings/warnings-updater';
import { ProjectConfiguration } from '../services';


/**
 * @author Daniel de Oliveira
 * @author Thomas Kleinke
 * @author Sebastian Cuy
 */
 export module Indexer {
 
    export async function reindex(indexFacade: IndexFacade, db: any, documentCache: DocumentCache,
                                  warningsUpdater: WarningsUpdater, projectConfiguration: ProjectConfiguration,
                                  keepCachedInstances: boolean,
                                  setProgress?: (progress: number) => Promise<void>, setIndexing?: () => Promise<void>,
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
            if (keepCachedInstances) {
                documents = documents.filter(document => !documentCache.get(document.resource?.id));
            }
            documents = migrateDocuments(documents, projectConfiguration);
            documents.forEach(document => {
                warningsUpdater.updateIndexIndependentWarnings(document);
                documentCache.set(document);
            });

            if (keepCachedInstances) {
                documentCache.getAll().forEach(document => {
                    warningsUpdater.updateIndexIndependentWarnings(document);
                });
                documents = documents.concat(documentCache.getAll());
            }

            await indexFacade.putMultiple(documents, setProgress);
            await addIndexDependentWarnings(indexFacade, documentCache, warningsUpdater, setProgress);
        } catch (err) {
            console.error(err);
            setError && setError('indexingError');
            throw err;
        }
    }


    async function fetchAll(db: any) {

        return (await db
            .allDocs({
                include_docs: true,
                conflicts: true
            })).rows
            .filter(row => !isDesignDoc(row))
            .map(row => row.doc);
    }


    function migrateDocuments(documents: Array<Document>,
                              projectConfiguration: ProjectConfiguration): Array<Document> {

        return documents.map(document => {
            try {
                Migrator.migrate(document, projectConfiguration);
                return document;
            } catch (err) {
                console.warn('Error while migrating document: ', err);
                return undefined;
            }
        }).filter(not(isUndefined));
    }


    async function addIndexDependentWarnings(indexFacade: IndexFacade, documentCache: DocumentCache,
                                             warningsUpdater: WarningsUpdater,
                                             setProgress?: (progress: number) => Promise<void>) {

        const documents: Array<Document> = documentCache.getAll();

        for (let i = 0; i < documents.length; i++) {
            const document: Document = documents[i];
            await warningsUpdater.updateIndexDependentWarnings(document);

            if (setProgress && (i % 250 === 0 || i === documents.length)) {
                await setProgress(documents.length * 0.75 + i * 0.25);
            }
        };

        indexFacade.notifyObservers();
    }


    const isDesignDoc = (row: any) => row.id.indexOf('_') === 0;
}
