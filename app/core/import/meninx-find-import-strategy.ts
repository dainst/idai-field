import {Document} from 'idai-components-2';
import {ImportStrategy} from './import-strategy';
import {DocumentDatastore} from '../datastore/document-datastore';
import {ImportReport} from './import-facade';
import {MeninxFindImporter} from './meninx-find-importer';


/**
 * @author Daniel de Oliveira
 * @author Juliane Watson
 */
export class MeninxFindImportStrategy implements ImportStrategy {

    public async import(documents: Array<Document>,
                        importReport: ImportReport,
                        datastore: DocumentDatastore,
                        username: string): Promise<ImportReport> {

        for (let docToUpdate of documents) {

            try {
                const importedDoc = await MeninxFindImporter.importDoc(docToUpdate, datastore, username);
                if (importedDoc) importReport.importedResourcesIds.push(importedDoc.resource.id);

            } catch (msgWithParams) {
                importReport.errors.push(msgWithParams);
                return importReport;
            }
        }

        return importReport;
    }
}
