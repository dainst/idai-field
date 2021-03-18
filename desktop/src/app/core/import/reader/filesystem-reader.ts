import {Reader} from './reader';
import {ReaderErrors} from './reader-errors';

const fs = typeof window !== 'undefined' ? window.require('fs') : require('fs');


/**
 * Reads contents of a file.
 * Expects a UTF-8 encoded text file.
 *
 * @author Sebastian Cuy
 * @author Jan G. Wieners
 * @author Thomas Kleinke
 */
export class FilesystemReader implements Reader {

    constructor(private file: any) {}


    public go(): Promise<string> {

        return new Promise((resolve, reject) => {

            fs.readFile(this.file.path, 'utf-8', (err: any, content: any) => {
                if (err) {
                    reject([ReaderErrors.FILE_UNREADABLE, this.file.path]);
                } else {
                    resolve(content);
                }
            });
        });
    }
}
