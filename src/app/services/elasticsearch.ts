import {Injectable} from "angular2/core";
import {Http} from "angular2/http";
import {IdaiFieldObject} from "../model/idai-field-object";

/**
 * @author Jan G. Wieners
 */
@Injectable()
export class Elasticsearch {

    private hostUrl;

    constructor(private http: Http) {
    }

    setHost(host: string) {
        this.hostUrl = host;
    }

    save(object:IdaiFieldObject):Promise<IdaiFieldObject> {

        return new Promise((resolve, reject) => {

            this.http.post(this.hostUrl + '/idaifield/objects/' + object._id, JSON.stringify(object))
                .subscribe(
                    data => {
                        resolve(object);
                    },
                    err => reject()
                );
        });
    }

}