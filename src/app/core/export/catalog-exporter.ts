import {DocumentReadDatastore} from '../datastore/document-read-datastore';
import {getExportDocuments} from './catalog/get-export-documents';
import {Name} from '../constants';
const fs = typeof window !== 'undefined' ? window.require('fs') : require('fs');


// TODO implement deletion of imported catalogs, together with all types and images
export module CatalogExporter {

    export async function performExport(datastore: DocumentReadDatastore,
                                        outputFilePath: string,
                                        catalogId: string,
                                        project: Name): Promise<void> {

        const [exportDocuments, _imageResourceIds] = await getExportDocuments(datastore, catalogId, project);

        // TODO save images to folder

        fs.writeFileSync(
            outputFilePath,
            exportDocuments
                .map(stringify)
                .join('\n') // TODO different operating systems?
        );

        // TODO zip images and jsonl
    }
}


const stringify = jsonObject => JSON.stringify(jsonObject);
