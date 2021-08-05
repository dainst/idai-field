import {ImageRelationsManager} from '../../../services/image-relations-manager';
import {Settings} from '../../../services/settings/settings';
import { Resource, StringUtils, Datastore } from 'idai-field-core';
import { getExportDocuments } from './get-export-documents';


const fs = typeof window !== 'undefined' ? window.require('fs') : require('fs');
const archiver = typeof window !== 'undefined' ? window.require('archiver') : require('archiver');
const remote = typeof window !== 'undefined' ? window.require('@electron/remote') : undefined;

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

        fs.rmdirSync(tmpDir, { recursive: true });
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

        zipFiles(outputFilePath, tmpDir, imgDir, () => {
            fs.rmdirSync(tmpDir, { recursive: true });
        });
    }


    function zipFiles(outputFilePath: string,
                      tmpDir: string,
                      imgDir: string,
                      onClose: () => void) {

        const archive = archiver('zip');
        archive.on('error', function (err) {
            throw err;
        });
        const output = fs.createWriteStream(outputFilePath);
        output.on('close', onClose);
        archive.pipe(output);
        archive.file(tmpDir + CATALOG_JSONL, { name: CATALOG_JSONL });
        archive.directory(imgDir, CATALOG_IMAGES);
        archive.finalize();
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
