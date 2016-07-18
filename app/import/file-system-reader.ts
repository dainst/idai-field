import {Injectable} from "@angular/core";

/**
 * Reads contents of a file.
 * Expects a UTF-8 encoded text file.
 *
 * @author Sebastian Cuy
 * @author Jan G. Wieners
 */
@Injectable()
export class FileSystemReader {

    /**
     * Read content of file
     *
     * @param file the file to be read
     * @returns {Promise<String>} A promise which resolves to the file content when the file is loaded.
     */
    public read(file: File): Promise<String> {

        return new Promise((resolve, reject) => {

            let reader = new FileReader();

            reader.onload = (event: any) => {
                resolve(event.target.result);
            };

            reader.onerror = (event: any) => {
                reject(event.target.error);
            };

            reader.readAsText(file);
        });
    }
}