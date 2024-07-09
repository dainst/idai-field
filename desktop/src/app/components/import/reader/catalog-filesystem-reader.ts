import { Map } from 'tsfun';
import { ImageStore, IdGenerator } from 'idai-field-core';
import { Reader } from './reader';
import { ReaderErrors } from './reader-errors';
import { APP_DATA, CATALOG_IMAGES, CATALOG_JSONL, TEMP } from '../../export/catalog/catalog-exporter';
import { Settings } from '../../../../app/services/settings/settings';
import { getAsynchronousFs } from '../../../services/get-asynchronous-fs';

const fs = window.require('fs');
const remote = window.require('@electron/remote');


/**
 * @author Daniel de Oliveira
 */
export class CatalogFilesystemReader implements Reader {

    constructor(private filePath: string,
                private settings: Settings,
                private imagestore: ImageStore) {}


    public go(): Promise<string> {

        return new Promise(async (resolve, reject) => {

            const tmpBaseDir = remote.app.getPath(APP_DATA) + '/' + remote.app.getName() + '/' + TEMP + '/';
            const tmpDir = tmpBaseDir + 'catalog-import/';
            const imgDir = tmpDir + CATALOG_IMAGES + '/';
            if (fs.existsSync(tmpDir)) fs.rmSync(tmpDir, { recursive: true });
            fs.mkdirSync(imgDir, { recursive: true });
            const targetDir = this.settings.imagestorePath
                + this.settings.selectedProject
                + '/';
            if (!fs.existsSync(targetDir)) fs.mkdirSync(targetDir);

            try {
                await getAsynchronousFs().extractZip(this.filePath, tmpDir);

                const idGenerator = new IdGenerator();
                const replacementMap: Map<string> = {};

                for (let imageFileName of fs.readdirSync(imgDir)) {
                    const newImageFileName: string = idGenerator.generateId();
                    replacementMap[imageFileName] = newImageFileName;

                    if (!fs.existsSync(targetDir + newImageFileName)) {
                        fs.copyFileSync(imgDir + imageFileName, targetDir + newImageFileName);
                        await this.imagestore.createThumbnail(
                            newImageFileName,
                            fs.readFileSync(targetDir + newImageFileName),
                            this.settings.selectedProject
                        );
                    }
                }

                let jsonlString = fs.readFileSync(tmpDir + CATALOG_JSONL, 'utf-8');
                for (let imageId of Object.keys(replacementMap)) {
                    jsonlString = jsonlString.replace(new RegExp(imageId, 'g'), replacementMap[imageId]);
                }

                resolve(jsonlString);
            } catch (err) {
                console.error(err);
                reject([ReaderErrors.CATALOG_GENERIC]);
            } finally {
                fs.rmSync(tmpDir, { recursive: true });
            }
        });
    }
}
