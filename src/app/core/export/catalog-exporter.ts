import {DocumentReadDatastore} from '../datastore/document-read-datastore';
import {getExportDocuments} from './catalog/get-export-documents';
import {Name} from '../constants';
const fs = typeof window !== 'undefined' ? window.require('fs') : require('fs');

// TODO in the user interface: make sure the imported images cannot be deleted or edited directly
// TODO implement deletion of imported catalogs, together with all types and images

export module CatalogExporter {

    export async function performExport(datastore: DocumentReadDatastore,
                                        outputFilePath: string,
                                        catalogId: string,
                                        project: Name): Promise<void> {

        fs.writeFileSync(
            outputFilePath,
            (await getExportDocuments(datastore, catalogId, project))
                .map(stringify)
                .join('\n') // TODO operating system?
        );
    }
}


const stringify = jsonObject => JSON.stringify(jsonObject);
