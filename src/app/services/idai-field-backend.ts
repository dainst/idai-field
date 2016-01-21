import {Injectable} from "angular2/core";
import {Http} from "angular2/http";
import {IdaiFieldObject} from "../model/idai-field-object";
import {Utils} from '../utils';
import {Observable} from "rxjs/Observable";
import {Response} from "angular2/http";

/**
 * @author Jan G. Wieners
 * @author Daniel M. de Oliveira
 */
@Injectable()
export class IdaiFieldBackend {

    private typeName  : string = "objects";
    private hostUrl   : string;
    private indexName : string;

    public constructor(private http: Http) {
    }

    public setHostName(hostName: string) {
        this.hostUrl = hostName;
    }

    public setIndexName(indexName:string):void {
        this.indexName= indexName;
    }

    /**
     * @param object
     * @return new IdaiFieldObject without the properties which we don't want
     *   to send to the backend.
     */
    private filterUnwantedProps(object:IdaiFieldObject) : IdaiFieldObject {
        var o = Utils.clone(object);
        delete o.synced;
        return o;
    }

    private performPost(object:IdaiFieldObject) : Observable<Response> {

        return this.http.post(this.hostUrl + '/' + this.indexName + '/'
            + this.typeName + '/' + object._id,
            JSON.stringify(object))
    }

    public save(object:IdaiFieldObject):Promise<IdaiFieldObject> {

        return new Promise((resolve, reject) => {
            this.performPost(this.filterUnwantedProps(object))
            .subscribe(
                () => resolve(object),
                err => reject()
            );
        });
    }

}