import {Reader} from './reader';
import {ReaderErrors} from './reader-errors';

/**
 * Reads contents of a file.
 * Expects a UTF-8 encoded text file.
 *
 * @author Sebastian Cuy
 * @author Jan G. Wieners
 */
export class FileSystemReader implements Reader {

    constructor(private file: File) {}


    /**
     * Read content of file
     *
     * @returns {Promise<string>} file content | msgWithParams
     */
    public go(): Promise<string> {

        return new Promise((resolve, reject) => {

            let reader = new FileReader();

            reader.onload = (event: any) => {
                resolve(event.target.result);
            };

            reader.onerror = (event: any) => {
                console.error(event.target.error);
                reject([ReaderErrors.FILE_UNREADABLE, this.file.name]);
            };

            reader.readAsText(this.file);
        });
    }
}