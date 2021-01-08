import {DocumentReadDatastore} from '../../datastore/document-read-datastore';
import {getExportDocuments} from './get-export-documents';
import {Settings} from '../../settings/settings';
import {ResourceId} from '../../constants';
import {RelationsManager} from '../../model/relations-manager';
import {ImageRelationsManager} from '../../model/image-relations-manager';
import {stringify} from '../../util/utils';

const fs = typeof window !== 'undefined' ? window.require('fs') : require('fs');
const archiver = typeof window !== 'undefined' ? window.require('archiver') : require('archiver');
const remote = typeof window !== 'undefined' ? window.require('electron').remote : require('electron').remote;

export const ERROR_FAILED_TO_COPY_IMAGES = 'export.catalog.failedToCopyImages';

export const CATALOG_JSONL = 'catalog.jsonl';
export const CATALOG_IMAGES = 'images';
export const TEMP = 'temp';
export const APP_DATA = 'appData';


export module CatalogExporter {

    /**
     * @throws an error if something goes wrong
     */
    export async function performExport(datastore: DocumentReadDatastore,
                                        relationsManager: RelationsManager,
                                        imageRelationsManager: ImageRelationsManager,
                                        outputFilePath: string,
                                        catalogId: string,
                                        settings: Settings): Promise<void> {

        const [error, results] =
            await getExportDocuments(datastore, relationsManager, imageRelationsManager, catalogId, settings.selectedProject);
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
                .map(stringify)
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
                            imageResourceIds: Array<ResourceId>,
                            settings: Settings) {

        for (let image of imageResourceIds) {
            const source = settings.imagestorePath
                + settings.selectedProject + '/' + image;
            fs.copyFileSync(source, imagesTargetPath + image);
        }
    }
}
