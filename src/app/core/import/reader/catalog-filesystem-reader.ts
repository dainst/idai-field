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

            // TODO review duplication
            const tmpBaseDir = remote.app.getPath('appData') + '/' + remote.app.getName() + '/temp/';
            const tmpDir = tmpBaseDir + 'catalog-import/';
            const imgDir = tmpDir + 'images/';
            fs.rmdirSync(tmpDir, { recursive: true });
            fs.mkdirSync(imgDir, { recursive: true });

            try {

                await extract(this.file.path, { dir: tmpDir });

                const imagesFolder = fs.readdirSync(imgDir);
                const data = fs.readFileSync(tmpDir + 'catalog.jsonl', 'utf-8');

                for (let imageFile of imagesFolder) {
                    const source = imgDir + imageFile;
                    const target = this.settings.imagestorePath
                        + this.settings.selectedProject
                        + '/';
                    if (!fs.existsSync(target)) fs.mkdirSync(target);
                    fs.copyFileSync(source, target + imageFile);
                }

                resolve(data);
            } catch (err) {
                console.log("err", err)
                reject([ReaderErrors.SHAPEFILE_GENERIC]); // TODO use other error
            } finally {
                fs.rmdirSync(tmpDir, { recursive: true });
            }
        });
    }
}
