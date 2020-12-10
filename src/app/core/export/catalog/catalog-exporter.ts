import {DocumentReadDatastore} from '../../datastore/document-read-datastore';
import {getExportDocuments} from './get-export-documents';
import {Settings} from '../../settings/settings';
import {ResourceId} from '../../constants';
import {RelationsManager} from '../../model/relations-manager';
import {ImageRelationsManager} from '../../model/image-relations-manager';

const fs = typeof window !== 'undefined' ? window.require('fs') : require('fs');


export module CatalogExporter {

    export async function performExport(datastore: DocumentReadDatastore,
                                        relationsManager: RelationsManager,
                                        imageRelationsManager: ImageRelationsManager,
                                        outputFilePath: string,
                                        catalogId: string,
                                        settings: Settings): Promise<void> {

        const [exportDocuments, imageResourceIds] =
            await getExportDocuments(datastore, relationsManager, imageRelationsManager, catalogId, settings.selectedProject);

        copyImageFiles(outputFilePath, imageResourceIds, settings);

        fs.writeFileSync(
            outputFilePath,
            exportDocuments
                .map(stringify)
                .join('\n')
        );
    }


    function copyImageFiles(outputFilePath: string,
                            imageResourceIds: Array<ResourceId>,
                            settings: Settings) {

        const basePath = outputFilePath
            .slice(0, outputFilePath.lastIndexOf('.')) + '/';
        if (!fs.existsSync(basePath)) fs.mkdirSync(basePath);

        for (let image of imageResourceIds) {
            const source = settings.imagestorePath
                + settings.selectedProject + '/' + image;
            const target = basePath + image;
            fs.copyFileSync(source, target);
        }
    }
}


const stringify = jsonObject => JSON.stringify(jsonObject);
