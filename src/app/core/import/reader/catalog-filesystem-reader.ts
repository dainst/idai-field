import {Reader} from './reader';
import {ReaderErrors} from './reader-errors';
import {Settings} from '../../settings/settings';

const fs = typeof window !== 'undefined' ? window.require('fs') : require('fs');


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

            const basePath = this.file.path
                .slice(0, this.file.path.lastIndexOf('.')) + '/'; // TODO review code duplication with catalog exporter

            try {
                const folder = fs.readdirSync(basePath);
                const data = fs.readFileSync(this.file.path, 'utf-8');

                for (let file of folder) {
                    const source = basePath + file;
                    const target = this.settings.imagestorePath
                        + this.settings.selectedProject
                        + '/';
                    if (!fs.existsSync(target)) fs.mkdirSync(target);
                    fs.copyFileSync(source, target + file);
                }

                resolve(data);
            } catch (err) {
                reject([ReaderErrors.SHAPEFILE_GENERIC]); // TODO use other error
            }
        });
    }
}
