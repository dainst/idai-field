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

        try {
            const imgDir = tmpDir + 'images/';

            fs.rmdirSync(tmpDir, { recursive: true });
            fs.mkdirSync(imgDir, { recursive: true });

            copyImageFiles(imgDir, imageResourceIds, settings);

            fs.writeFileSync(
                tmpDir + 'catalog.jsonl',
                exportDocuments
                    .map(stringify)
                    .join('\n')
            );

            const output = fs.createWriteStream(outputFilePath);
            archive.on('error', function (err) {
                throw err;
            });
            output.on('close', () => {
                console.log("closed")
                fs.rmdirSync(tmpDir, { recursive: true });
            })
            archive.pipe(output);
            archive.file(tmpDir + 'catalog.jsonl', { name: 'catalog.jsonl' });
            archive.directory(tmpDir + 'images', 'images');
            archive.finalize();

        } catch (error) {
            throw ['catalog exporter error', error]; // TODO make error constant
        }
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
