import {Injectable} from "angular2/core";
import {Http} from "angular2/http";
import {IdaiFieldObject} from "../model/idai-field-object";

/**
 * @author Jan G. Wieners
 */
@Injectable()
export class IdaiFieldBackend {

    private hostUrl : string;
    private indexName : string;

    constructor(private http: Http) {
    }

    setHostName(hostName: string) {
        this.hostUrl = hostName;
    }

    setIndexName(indexName:string):void {
        this.indexName= indexName;
    }

    save(object:IdaiFieldObject):Promise<IdaiFieldObject> {

        return new Promise((resolve, reject) => {

            this.http.post(this.hostUrl + '/' + this.indexName + '/objects/' + object._id, JSON.stringify(object))
            .subscribe(
            data => {
                        resolve(object);
                    },
            err => reject()
            );
        });
    }

}