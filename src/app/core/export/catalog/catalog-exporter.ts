import {DocumentReadDatastore} from '../../datastore/document-read-datastore';
import {getExportDocuments} from './get-export-documents';
import {Settings} from '../../settings/settings';
import {ResourceId} from '../../constants';
import {RelationsManager} from '../../model/relations-manager';
import {ImageRelationsManager} from '../../model/image-relations-manager';

const fs = typeof window !== 'undefined' ? window.require('fs') : require('fs');
const archiver = typeof window !== 'undefined' ? window.require('archiver') : require('archiver');
const remote = typeof window !== 'undefined' ? window.require('electron').remote : require('electron').remote;

const archive = archiver('zip');

const CATALOG_JSONL = 'catalog.jsonl'

export module CatalogExporter {

    export async function performExport(datastore: DocumentReadDatastore,
                                        relationsManager: RelationsManager,
                                        imageRelationsManager: ImageRelationsManager,
                                        outputFilePath: string,
                                        catalogId: string,
                                        settings: Settings): Promise<void> {

        const [exportDocuments, imageResourceIds] =
            await getExportDocuments(datastore, relationsManager, imageRelationsManager, catalogId, settings.selectedProject);

        const tmpBaseDir = remote.app.getPath('appData') + '/' + remote.app.getName() + '/temp/';
        const tmpDir = tmpBaseDir + 'catalog-export/';
        const imgDir = tmpDir + 'images/';

        try {

            fs.rmdirSync(tmpDir, { recursive: true });
            fs.mkdirSync(imgDir, { recursive: true });

            copyImageFiles(imgDir, imageResourceIds, settings);

            fs.writeFileSync(
                tmpDir + CATALOG_JSONL,
                exportDocuments
                    .map(stringify)
                    .join('\n')
            );

            zipFiles(outputFilePath, tmpDir, imgDir, () => {
                fs.rmdirSync(tmpDir, { recursive: true });
            });

        } catch (error) {
            throw ['catalog exporter error', error]; // TODO make error constant
        }
    }


    function zipFiles(outputFilePath: string,
                      tmpDir: string,
                      imgDir: string,
                      onClose: () => void) {

        const output = fs.createWriteStream(outputFilePath);
        archive.on('error', function (err) {
            throw err;
        });
        output.on('close', onClose);
        archive.pipe(output);
        archive.file(tmpDir + CATALOG_JSONL, { name: CATALOG_JSONL });
        archive.directory(imgDir, 'images');
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


const stringify = jsonObject => JSON.stringify(jsonObject);
