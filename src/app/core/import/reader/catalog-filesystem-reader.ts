import {Reader} from './reader';
import {ReaderErrors} from './reader-errors';
import {Settings} from '../../settings/settings';
import {APP_DATA, CATALOG_IMAGES, CATALOG_JSONL, TEMP} from '../../export/catalog/catalog-exporter';

const fs = typeof window !== 'undefined' ? window.require('fs') : require('fs');
const extract = typeof window !== 'undefined' ? window.require('extract-zip') : require('extract-zip');
const remote = typeof window !== 'undefined' ? window.require('electron').remote : require('electron').remote;

const UTF8 = 'utf-8';

/**
 * @author Daniel de Oliveira
 */
export class CatalogFilesystemReader implements Reader {

    constructor(private file: any, private settings: Settings) {}


    /* TODO
     * maybe we put the files in a tmp folder under the project images dir
     * then we can check them later in import catalog
     */
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
                    fs.copyFileSync(
                        imgDir + imageFile,
                        targetDir + imageFile
                    );
                }

                resolve(fs.readFileSync(tmpDir + CATALOG_JSONL, UTF8));
            } catch (err) {
                reject([ReaderErrors.SHAPEFILE_GENERIC]); // TODO use other error
            } finally {
                fs.rmdirSync(tmpDir, { recursive: true });
            }
        });
    }
}
