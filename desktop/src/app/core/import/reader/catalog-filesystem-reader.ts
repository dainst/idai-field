import {Reader} from './reader';
import {ReaderErrors} from './reader-errors';
import {Settings} from '../../settings/settings';
import {APP_DATA, CATALOG_IMAGES, CATALOG_JSONL, TEMP} from '../../export/catalog/catalog-exporter';

const fs = typeof window !== 'undefined' ? window.require('fs') : require('fs');
const extract = typeof window !== 'undefined' ? window.require('extract-zip') : require('extract-zip');
const remote = typeof window !== 'undefined' ? window.require('@electron/remote') : undefined;

const UTF8 = 'utf-8';

/**
 * @author Daniel de Oliveira
 */
export class CatalogFilesystemReader implements Reader {

    constructor(private file: any, private settings: Settings) {}


    public go(): Promise<string> {

        return new Promise(async (resolve, reject) => {

            const tmpBaseDir = remote.app.getPath(APP_DATA) + '/' + remote.app.getName() + '/' + TEMP + '/';
            const tmpDir = tmpBaseDir + 'catalog-import/';
            const imgDir = tmpDir + CATALOG_IMAGES + '/';
            fs.rmdirSync(tmpDir, { recursive: true });
            fs.mkdirSync(imgDir, { recursive: true });
            const targetDir = this.settings.imagestorePath
                + this.settings.selectedProject
                + '/';
            if (!fs.existsSync(targetDir)) fs.mkdirSync(targetDir);

            try {
                await extract(this.file.path, { dir: tmpDir });

                for (let imageFile of fs.readdirSync(imgDir)) {
                    if (!fs.existsSync(targetDir + imageFile)) {
                        fs.copyFileSync(
                            imgDir + imageFile,
                            targetDir + imageFile
                        );
                    }
                }

                resolve(fs.readFileSync(tmpDir + CATALOG_JSONL, UTF8));
            } catch (err) {
                reject([ReaderErrors.CATALOG_GENERIC]);
            } finally {
                fs.rmdirSync(tmpDir, { recursive: true });
            }
        });
    }
}
