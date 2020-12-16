import {Reader} from './reader';
import {ReaderErrors} from './reader-errors';
import {Settings} from '../../settings/settings';

const fs = typeof window !== 'undefined' ? window.require('fs') : require('fs');
const extract = typeof window !== 'undefined' ? window.require('extract-zip') : require('extract-zip');


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

                const outputDir = this.file.path
                    .slice(0, this.file.path.lastIndexOf('.'));
                await extract(this.file.path, { dir: outputDir });

                const imagesFolder = fs.readdirSync(basePath + 'images');
                const data = fs.readFileSync(basePath + 'catalog.jsonl', 'utf-8');

                for (let file of imagesFolder) {
                    const source = basePath + 'images/' + file;
                    const target = this.settings.imagestorePath
                        + this.settings.selectedProject
                        + '/';
                    if (!fs.existsSync(target)) fs.mkdirSync(target);
                    fs.copyFileSync(source, target + file);
                }

                resolve(data);
            } catch (err) {
                console.log("err", err)
                reject([ReaderErrors.SHAPEFILE_GENERIC]); // TODO use other error
            }
        });
    }
}
