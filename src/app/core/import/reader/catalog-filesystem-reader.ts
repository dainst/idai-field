import {Reader} from './reader';
import {ReaderErrors} from './reader-errors';
import {Settings} from '../../settings/settings';

const fs = typeof window !== 'undefined' ? window.require('fs') : require('fs');
const extract = typeof window !== 'undefined' ? window.require('extract-zip') : require('extract-zip');
const remote = typeof window !== 'undefined' ? window.require('electron').remote : require('electron').remote;

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

            const tmpBaseDir = remote.app.getPath('appData') + '/' + remote.app.getName() + '/temp/';
            const tmpDir = tmpBaseDir + 'catalog-import/';
            const imgDir = tmpDir + 'images/';
            fs.rmdirSync(tmpDir, { recursive: true });
            fs.mkdirSync(imgDir, { recursive: true });

            try {
                await extract(this.file.path, { dir: tmpDir });

                const targetDir = this.settings.imagestorePath
                    + this.settings.selectedProject
                    + '/';
                if (!fs.existsSync(targetDir)) fs.mkdirSync(targetDir);

                for (let imageFile of fs.readdirSync(imgDir)) {
                    fs.copyFileSync(
                        imgDir + imageFile,
                        targetDir + imageFile
                    );
                }

                resolve(fs.readFileSync(tmpDir + 'catalog.jsonl', 'utf-8'));
            } catch (err) {
                reject([ReaderErrors.SHAPEFILE_GENERIC]); // TODO use other error
            } finally {
                fs.rmdirSync(tmpDir, { recursive: true });
            }
        });
    }
}
