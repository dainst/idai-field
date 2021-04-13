import {Reader} from './reader';
import {JavaToolExecutor} from '../../java/java-tool-executor';
import {ReaderErrors} from './reader-errors';

const remote = typeof window !== 'undefined' ? window.require('@electron/remote') : undefined;
const fs = typeof window !== 'undefined' ? window.require('fs') : require('fs');


/**
 * @author Thomas Kleinke
 */
export class ShapefileFilesystemReader implements Reader {

    constructor(private file: any) {}


    public go(): Promise<string> {

        return new Promise(async (resolve, reject) => {

            ShapefileFilesystemReader.removeTempFileIfExisting();

            try {
                await JavaToolExecutor.executeJavaTool('shapefile-tool.jar', this.getArguments());
            } catch (err) {
                reject(ShapefileFilesystemReader.getImportErrorMsgWithParams(err));
            }

            fs.readFile(ShapefileFilesystemReader.getTempFilePath(), 'utf-8', (err, data) => {
                fs.unlinkSync(ShapefileFilesystemReader.getTempFilePath());

                if (err) {
                    reject([ReaderErrors.SHAPEFILE_GENERIC]);
                } else {
                    resolve(data);
                }
            });
        });
    }


    private getArguments(): string {

        return '"convert" "' + this.file.path + '" "' + ShapefileFilesystemReader.getTempFilePath() + '"';
    }


    private static removeTempFileIfExisting() {

        const tempFilePath: string = ShapefileFilesystemReader.getTempFilePath();
        if (fs.existsSync(tempFilePath)) fs.unlinkSync(tempFilePath);
    }


    private static getTempFilePath(): string {

        return remote.getGlobal('appDataPath') + '/temp/shapefile-resources.jsonl'
    }


    private static getImportErrorMsgWithParams(error: string): string[] {

        if (error.includes('CONVERTER_UNSUPPORTED_GEOMETRY_TYPE')) {
            return [
                ReaderErrors.SHAPEFILE_UNSUPPORTED_GEOMETRY_TYPE,
                JavaToolExecutor.getParameterFromErrorMessage(error)
            ];
        } else if (error.includes('CONVERTER_SHAPEFILE_READ_ERROR')) {
            return [ReaderErrors.SHAPEFILE_READ];
        } else if (error.includes('CONVERTER_JSONL_WRITE_ERROR')) {
            return [
                ReaderErrors.SHAPEFILE_JSONL_WRITE,
                JavaToolExecutor.getParameterFromErrorMessage(error)
            ];
        } else {
            console.error(error);
            return [ReaderErrors.SHAPEFILE_GENERIC];
        }
    }

}
