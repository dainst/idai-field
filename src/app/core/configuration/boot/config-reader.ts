import {Injectable} from '@angular/core';
import {HttpClient} from '@angular/common/http';
import {ConfigurationErrors} from './configuration-errors';


@Injectable()
/**
 * @author Daniel de Oliveira
 * @author Thomas Kleinke
 */
export class ConfigReader {

    constructor(private http: HttpClient) {}


    public read(path: string): Promise<any> {

        return new Promise((resolve, reject) => {

            this.http.get(path).subscribe(
                (data: any) => resolve(data),
                (error: any) => {
                    console.error(error);
                    reject([ConfigurationErrors.INVALID_JSON, path]);
                }
            );
        });
    }
}
