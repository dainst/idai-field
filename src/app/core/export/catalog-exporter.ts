import {DocumentReadDatastore} from '../datastore/document-read-datastore';
import {getExportDocuments} from './catalog/get-export-documents';
import {Settings} from '../settings/settings';
const fs = typeof window !== 'undefined' ? window.require('fs') : require('fs');


// TODO implement deletion of imported catalogs, together with all types and images
export module CatalogExporter {

    export async function performExport(datastore: DocumentReadDatastore,
                                        outputFilePath: string,
                                        catalogId: string,
                                        settings: Settings): Promise<void> {

        const [exportDocuments, _imageResourceIds] =
            await getExportDocuments(datastore, catalogId, Settings.getSelectedProject(settings));

        // TODO save images to folder
        // const imagestorePath = settings.imagestorePath;

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
