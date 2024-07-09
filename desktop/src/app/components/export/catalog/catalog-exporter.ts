import { Resource, StringUtils, Datastore } from 'idai-field-core';
import { ImageRelationsManager } from '../../../services/image-relations-manager';
import { Settings } from '../../../services/settings/settings';
import { getAsynchronousFs } from '../../../services/get-asynchronous-fs';
import { getExportDocuments } from './get-export-documents';

const fs = window.require('fs');
const remote = window.require('@electron/remote');


export const ERROR_FAILED_TO_COPY_IMAGES = 'export.catalog.failedToCopyImages';

export const CATALOG_JSONL = 'catalog.jsonl';
export const CATALOG_IMAGES = 'images';
export const TEMP = 'temp';
export const APP_DATA = 'appData';


export module CatalogExporter {

    /**
     * @throws an error if something goes wrong
     */
    export async function performExport(datastore: Datastore,
                                        imageRelationsManager: ImageRelationsManager,
                                        outputFilePath: string,
                                        catalogId: string,
                                        settings: Settings): Promise<void> {

        const [error, results] =
            await getExportDocuments(datastore, imageRelationsManager, catalogId, settings.selectedProject);
        if (error !== undefined) throw error;
        const [exportDocuments, imageResourceIds] = results;

        const tmpBaseDir = remote.app.getPath(APP_DATA) + '/' + remote.app.getName() + '/' + TEMP + '/';
        const tmpDir = tmpBaseDir + 'catalog-export/';
        const imgDir = tmpDir + CATALOG_IMAGES + '/';

        if (fs.existsSync(tmpDir)) fs.rmSync(tmpDir, { recursive: true });
        fs.mkdirSync(imgDir, { recursive: true });

        try {
            copyImageFiles(imgDir, imageResourceIds, settings);
        } catch (err) {
            throw [ERROR_FAILED_TO_COPY_IMAGES];
        }

        fs.writeFileSync(
            tmpDir + CATALOG_JSONL,
            exportDocuments
                .map(StringUtils.stringify)
                .join('\n')
        );

        try {
            await getAsynchronousFs().createCatalogZip(
                outputFilePath, tmpDir + CATALOG_JSONL, CATALOG_JSONL, imgDir, CATALOG_IMAGES
            );
        } catch (err) {
            console.error(err); // TODO Improve error handling
        } finally {
            fs.rmSync(tmpDir, { recursive: true });
        }
    }


    function copyImageFiles(imagesTargetPath: string,
                            imageResourceIds: Array<Resource.Id>,
                            settings: Settings) {

        for (let image of imageResourceIds) {
            const source = settings.imagestorePath
                + settings.selectedProject + '/' + image;
            fs.copyFileSync(source, imagesTargetPath + image);
        }
    }
}
