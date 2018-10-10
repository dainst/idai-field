import {Reader} from "./reader";
import {Http} from "@angular/http";
import {M} from '../../components/m';

/**
 * @author Daniel de Oliveira
 */
export class HttpReader implements Reader {

    constructor(private url: string,private http: Http) {}

    public go(): Promise<string> {

        return new Promise((resolve, reject) => {
            this.http.get(this.url)
                .subscribe(
                    data => resolve((data as any)['_body']),
                    err => reject([M.IMPORT_ERROR_FILE_UNREADABLE, this.url])
                );
        });
    }
}