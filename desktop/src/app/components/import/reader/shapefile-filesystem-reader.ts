import { Reader } from './reader';
import { JavaToolExecutor } from '../../../services/java/java-tool-executor';
import { ReaderErrors} from './reader-errors';

const remote = window.require('@electron/remote');
const fs = window.require('fs');


/**
 * @author Thomas Kleinke
 */
export class ShapefileFilesystemReader implements Reader {

    constructor(private filePath: string) {}


    public async go(): Promise<string> {

        ShapefileFilesystemReader.removeTempFileIfExisting();

        try {
            await JavaToolExecutor.executeJavaTool('shapefile-tool.jar', this.getArguments());
        } catch (err) {
            throw ShapefileFilesystemReader.getImportErrorMsgWithParams(err);
        }

        try {
            const data = fs.readFileSync(ShapefileFilesystemReader.getTempFilePath(), 'utf-8');
            fs.unlinkSync(ShapefileFilesystemReader.getTempFilePath());
            return data;
        } catch (err) {
            throw [ReaderErrors.SHAPEFILE_GENERIC];
        }
    }


    private getArguments(): string {

        return '"convert" "' + this.filePath + '" "' + ShapefileFilesystemReader.getTempFilePath() + '"';
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
