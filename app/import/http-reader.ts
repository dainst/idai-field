import {Reader} from "./reader";
import {Http} from "@angular/http";
import {M} from "../m";

/**
 * @author Daniel de Oliveira
 */
export class HttpReader implements Reader {

    constructor(private url: string,private http:Http) {}

    public go(): Promise<string> {

        return new Promise((resolve, reject) => {
            this.http.get(this.url)
                .subscribe(
                    data => resolve(data['_body']),
                    err => reject([M.IMPORTER_FAILURE_FILEUNREADABLE, this.url]) // TODO test this and change the err msg
                );
        });
    }
}