import { isUndefined, not } from 'tsfun';
import { IndexFacade } from './index-facade';
import { DocumentConverter, DatastoreErrors, DocumentCache } from '../datastore';
import { Document } from '../model/document';
import { CategoryForm } from '../model/configuration/category-form';
import { WarningsUpdater } from '../datastore/warnings-updater';
import { ProjectConfiguration } from '../services';
import { Warnings } from '../model';


/**
 * @author Daniel de Oliveira
 * @author Thomas Kleinke
 * @author Sebastian Cuy
 */
 export module Indexer {
 
    export async function reindex(indexFacade: IndexFacade, db: PouchDB.Database, documentCache: DocumentCache,
                                  converter: DocumentConverter, projectConfiguration: ProjectConfiguration,
                                  keepCachedInstances: boolean, setIndexedDocuments?: (count: number) => Promise<void>,
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
                documentCache.getAll().forEach(document => {
                    if (document.resource.category !== 'Configuration') {
                        const category: CategoryForm = projectConfiguration.getCategory(document.resource.category);
                        if (category) WarningsUpdater.updateWarnings(document, category);
                    }
                });
                documents = documents.concat(documentCache.getAll());
            }

            await indexFacade.putMultiple(documents, setIndexedDocuments);
            addNonUniqueIdentifierWarnings(indexFacade, documentCache, projectConfiguration);
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


    function addNonUniqueIdentifierWarnings(indexFacade: IndexFacade, documentCache: DocumentCache,
                                            projectConfiguration: ProjectConfiguration) {

        documentCache.getAll().forEach(document => {
            const category: CategoryForm = projectConfiguration.getCategory(document.resource.category);
            WarningsUpdater.updateNonUniqueIdentifierWarning(document, indexFacade);
            WarningsUpdater.updateResourceLimitWarning(document, category, indexFacade);
            WarningsUpdater.updateRelationTargetWarning(document, indexFacade, documentCache);
        });
    }


    const isDesignDoc = (row: any) => row.id.indexOf('_') === 0;
}
