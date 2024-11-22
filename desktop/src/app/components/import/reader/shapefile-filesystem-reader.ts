import { Reader } from './reader';
import { ReaderErrors} from './reader-errors';

const remote = window.require('@electron/remote');
const ipcRenderer = window.require('electron')?.ipcRenderer;
const fs = window.require('fs');

const TEMP_DIRECTORY_PATH: string = remote ? remote.getGlobal('appDataPath') + '/gdal/' : '';


/**
 * @author Thomas Kleinke
 */
export class ShapefileFilesystemReader implements Reader {

    constructor(private filePath: string) {}


    public async go(): Promise<string> {

        const baseFileName: string = 'result_' + Date.now();

        const options: string[] = [
            '-f', 'GeoJSON'
        ];

        try {
            await ipcRenderer.invoke(
                'ogr2ogr',
                this.filePath,
                options,
                baseFileName
            );
        } catch (err) {
            console.error(err);
            throw [ReaderErrors.SHAPEFILE_READ];
        }

        try {
            return fs.readFileSync(TEMP_DIRECTORY_PATH + baseFileName + '.geojson', 'utf-8');
        } catch (err) {
            console.error(err);
            throw [ReaderErrors.SHAPEFILE_GENERIC];
        }
    }
}
