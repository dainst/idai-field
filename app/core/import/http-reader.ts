import {Reader} from "./reader";
import {HttpClient} from "@angular/common/http";
import {M} from "../../m";

/**
 * @author Daniel de Oliveira
 */
export class HttpReader implements Reader {

    constructor(private url: string,private http: HttpClient) {}

    public go(): Promise<string> {

        return new Promise((resolve, reject) => {
            this.http.get(this.url)
                .subscribe(
                    data => resolve((data as any)['_body']),
                    err => reject([M.IMPORT_FAILURE_FILEUNREADABLE, this.url])
                );
        });
    }
}