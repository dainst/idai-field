import * as fs from 'fs';
import {Reader} from './reader';
import {ImportErrors} from './import-errors';
import {JavaToolExecutor} from '../../common/java-tool-executor';

const remote = require('electron').remote;


/**
 * @author Thomas Kleinke
 */
export class ShapefileFileSystemReader implements Reader {

    constructor(private file: File) {}


    public go(): Promise<string> {

        return new Promise(async (resolve, reject) => {

            ShapefileFileSystemReader.removeTempFileIfExisting();

            try {
                await JavaToolExecutor.executeJavaTool('shapefile-tool.jar', this.getArguments());
            } catch (err) {
                reject(ShapefileFileSystemReader.getImportErrorMsgWithParams(err));
            }

            fs.readFile(ShapefileFileSystemReader.getTempFilePath(), 'utf-8', (err, data) => {
                fs.unlinkSync(ShapefileFileSystemReader.getTempFilePath());

                if (err) {
                    reject([ImportErrors.SHAPEFILE_GENERIC_ERROR]);
                } else {
                    resolve(data);
                }
            });
        });
    }


    private getArguments(): string {

        return '"convert" "' + this.file.path + '" "' + ShapefileFileSystemReader.getTempFilePath() + '"';
    }


    private static removeTempFileIfExisting() {

        const tempFilePath: string = ShapefileFileSystemReader.getTempFilePath();
        if (fs.existsSync(tempFilePath)) fs.unlinkSync(tempFilePath);
    }


    private static getTempFilePath(): string {

        return remote.getGlobal('appDataPath') + '/temp/shapefile-resources.jsonl'
    }


    private static getImportErrorMsgWithParams(error: string): string[] {

        if (error.includes('CONVERTER_UNSUPPORTED_GEOMETRY_TYPE')) {
            return [
                ImportErrors.SHAPEFILE_UNSUPPORTED_GEOMETRY_TYPE,
                JavaToolExecutor.getParameterFromErrorMessage(error)
            ];
        } else if (error.includes('CONVERTER_SHAPEFILE_READ_ERROR')) {
            return [ImportErrors.SHAPEFILE_READ_ERROR];
        } else if (error.includes('CONVERTER_JSONL_WRITE_ERROR')) {
            return [
                ImportErrors.SHAPEFILE_JSONL_WRITE_ERROR,
                JavaToolExecutor.getParameterFromErrorMessage(error)
            ];
        } else {
            console.error(error);
            return [ImportErrors.SHAPEFILE_GENERIC_ERROR];
        }
    }

}