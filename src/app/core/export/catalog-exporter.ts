import {DocumentReadDatastore} from '../datastore/document-read-datastore';
import {getExportDocuments} from './catalog/get-export-documents';
import {Settings} from '../settings/settings';
const fs = typeof window !== 'undefined' ? window.require('fs') : require('fs');


export module CatalogExporter {

    export async function performExport(datastore: DocumentReadDatastore,
                                        outputFilePath: string,
                                        catalogId: string,
                                        settings: Settings): Promise<void> {

        const [exportDocuments, imageResourceIds] =
            await getExportDocuments(datastore, catalogId, settings.selectedProject);

        const basePath = outputFilePath
            .slice(0, outputFilePath.lastIndexOf('.')) + '/'; // TODO operating systems
        if (!fs.existsSync(basePath)) fs.mkdirSync(basePath);

        for (let image of imageResourceIds) {
            const source = settings.imagestorePath + settings.selectedProject + '/' + image;
            const target = basePath + image;
            fs.copyFileSync(source, target);
        }

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
