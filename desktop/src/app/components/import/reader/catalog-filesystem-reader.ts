import { Map } from 'tsfun';
import { ImageStore, IdGenerator } from 'idai-field-core';
import { Reader } from './reader';
import { ReaderErrors } from './reader-errors';
import { APP_DATA, CATALOG_IMAGES, CATALOG_JSONL, TEMP } from '../../export/catalog/catalog-exporter';
import { Settings } from '../../../../app/services/settings/settings';

const fs = typeof window !== 'undefined' ? window.require('fs') : require('fs');
const unzipper = typeof window !== 'undefined' ? window.require('unzipper') : require('unzipper');
const remote = typeof window !== 'undefined' ? window.require('@electron/remote') : undefined;

const UTF8 = 'utf-8';

/**
 * @author Daniel de Oliveira
 */
export class CatalogFilesystemReader implements Reader {

    constructor(private file: any,
                private settings: Settings,
                private imagestore: ImageStore) {}


    public go(): Promise<string> {

        return new Promise(async (resolve, reject) => {

            const tmpBaseDir = remote.app.getPath(APP_DATA) + '/' + remote.app.getName() + '/' + TEMP + '/';
            const tmpDir = tmpBaseDir + 'catalog-import/';
            const imgDir = tmpDir + CATALOG_IMAGES + '/';
            if (fs.existsSync(tmpDir)) fs.rmdirSync(tmpDir, { recursive: true });
            fs.mkdirSync(imgDir, { recursive: true });
            const targetDir = this.settings.imagestorePath
                + this.settings.selectedProject
                + '/';
            if (!fs.existsSync(targetDir)) fs.mkdirSync(targetDir);

            try {
                console.log('extract...');
                await this.extractZip(this.file.path, tmpDir);
                console.log('extracted!');

                const idGenerator = new IdGenerator();
                const replacementMap: Map<string> = {};

                for (let imageFileName of fs.readdirSync(imgDir)) {
                    const newImageFileName: string = idGenerator.generateId();
                    replacementMap[imageFileName] = newImageFileName;

                    if (!fs.existsSync(targetDir + newImageFileName)) {
                        fs.copyFileSync(imgDir + imageFileName, targetDir + newImageFileName);
                        console.log('creating thumbnail...', newImageFileName);
                        await this.imagestore.createThumbnail(
                            newImageFileName,
                            fs.readFileSync(targetDir + newImageFileName),
                            this.settings.selectedProject
                        );
                        console.log('created thumbnail!', newImageFileName);
                    }
                }

                let jsonlString = fs.readFileSync(tmpDir + CATALOG_JSONL, UTF8);
                for (let imageId of Object.keys(replacementMap)) {
                    jsonlString = jsonlString.replace(new RegExp(imageId, 'g'), replacementMap[imageId]);
                }

                resolve(jsonlString);
            } catch (err) {
                console.error(err);
                reject([ReaderErrors.CATALOG_GENERIC]);
            } finally {
                fs.rmdirSync(tmpDir, { recursive: true });
            }
        });
    }


    private extractZip(source: string, destination: string): Promise<void> {

        return new Promise(function(resolve, reject) {
            try {
                const sourceStream = fs.createReadStream(source);
                sourceStream.on('error', err => reject(err));

                const destinationStream = unzipper.Extract({ path: destination });
                destinationStream.on('error', err => reject(err));
                destinationStream.on('close', () => resolve());

                sourceStream.pipe(destinationStream).on('error', (err) => reject(err));
            } catch (error) {
                reject(error);
            }
        });
    }
}
