import { Reader } from './reader';
import { ReaderErrors } from './reader-errors';

const remote = window.require('@electron/remote');
const ipcRenderer = window.require('electron')?.ipcRenderer;
const fs = window.require('fs');

const TEMP_DIRECTORY_PATH: string = remote ? remote.getGlobal('appDataPath') + '/gdal/' : '';


/**
 * @author Thomas Kleinke
 */
class VectorFilesystemReader implements Reader {

    constructor(private filePath: string,
                private readError: string,
                private genericError: string) {}


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
            throw [this.readError];
        }

        try {
            return fs.readFileSync(TEMP_DIRECTORY_PATH + baseFileName + '.geojson', 'utf-8');
        } catch (err) {
            console.error(err);
            throw [this.genericError];
        } finally {
            fs.rmSync(TEMP_DIRECTORY_PATH + baseFileName + '.geojson');
        }
    }
}


export class ShapefileFilesystemReader extends VectorFilesystemReader {

    constructor(filePath: string) {

        super(filePath, ReaderErrors.SHAPEFILE_READ, ReaderErrors.SHAPEFILE_GENERIC);
    }
}


export class DxfFilesystemReader extends VectorFilesystemReader {

    constructor(filePath: string) {

        super(filePath, ReaderErrors.VECTOR_READ, ReaderErrors.VECTOR_GENERIC);
    }
}
