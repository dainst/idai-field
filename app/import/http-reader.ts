import {Injectable} from "@angular/core";
import {Reader} from "./reader";
import {Http} from "@angular/http";

/**
 * @author Daniel de Oliveira
 */
export class HttpReader implements Reader{

    constructor(private url: string,private http:Http) {}

    public read(): Promise<string> {

        return new Promise((resolve, reject) => {
            this.http.get(this.url)
                .subscribe(
                    data => resolve(data['_body']),
                    err => reject(err)
                );
        });
    }
}