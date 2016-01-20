import {Injectable} from "angular2/core";
import {Http} from "angular2/http";

/**
 * @author Jan G. Wieners
 */
@Injectable()
export class Elasticsearch {

    private online;
    private hostUrl;

    constructor(private http: Http) {
    }

    setHost(host: string) {
        this.hostUrl = host;
    }

    isOnline(): boolean {

        this.http.get(this.hostUrl)
            .subscribe(
                data => console.log('Success', data), // set this.online true
                err => console.log('Error', err),  // set this.online false
                () => console.log('Complete')
            );
        return true;
    }

}