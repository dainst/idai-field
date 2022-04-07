import { getAsynchronousFs } from '../../../services/getAsynchronousFs';
import { Reader } from './reader';
import { ReaderErrors } from './reader-errors';


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


    public async go(): Promise<string> {

        try {
            return await getAsynchronousFs().readFile(this.file.path, 'utf-8');
        } catch (err) {
            console.error('Error while trying to read file: ' + this.file.path, err);
            throw [ReaderErrors.FILE_UNREADABLE, this.file.path];
        }
    }
}
