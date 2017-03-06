import {Injectable} from "@angular/core";
import {Reader} from "./reader";
import {M} from "../m";

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
                reject([M.IMPORTER_FAILURE_FILEUNREADABLE, this.file.name]);
            };

            reader.readAsText(this.file);
        });
    }
}