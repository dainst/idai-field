import {Injectable} from "@angular/core";
import {Reader} from "./reader";

/**
 * Reads contents of a file.
 * Expects a UTF-8 encoded text file.
 *
 * @author Sebastian Cuy
 * @author Jan G. Wieners
 */
@Injectable() // TODO this is not necessary anymore, isn't it?
export class FileSystemReader implements Reader{

    constructor(private file: File) {}

    /**
     * Read content of file
     *
     * @returns {Promise<String>} A promise which resolves to the file content when the file is loaded.
     */
    public read(): Promise<string> {

        return new Promise((resolve, reject) => {

            let reader = new FileReader();

            reader.onload = (event: any) => {
                resolve(event.target.result);
            };

            reader.onerror = (event: any) => {
                reject(event.target.error);
            };

            reader.readAsText(this.file);
        });
    }
}