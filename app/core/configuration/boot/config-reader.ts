import {Injectable} from '@angular/core';
import {HttpClient} from '@angular/common/http';
import {MDInternal} from '../../../components/messages/md-internal';

@Injectable()
/**
 * @author Daniel de Oliveira
 * @author Thomas Kleinke
 */
export class ConfigReader {

    constructor(private http: HttpClient) {}


    public read(path: string): Promise<any> {

        return new Promise((resolve, reject) => {

            this.http.get(path).subscribe((data_: any) => {

                let data;
                try {
                    data = data_;
                } catch(e) {
                    reject([MDInternal.CONFIG_READER_ERROR_INVALID_JSON, path]);
                }

                try {
                    resolve(data);
                } catch(e) {
                    console.error(e);
                }
            });
        });
    }
}