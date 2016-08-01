import {Injectable} from "@angular/core";
import {Observable} from "rxjs/Observable";
import {IdaiFieldDocument} from "../model/idai-field-document";
import {Parser,ParserError} from "./parser";
import {M} from "../m";

/**
 * @author Sebastian Cuy
 * @author Jan G. Wieners
 */
@Injectable()
export class NativeJsonlParser implements Parser {

    public parse(content: string):Observable<IdaiFieldDocument> {

        return Observable.create(observer => {

            var lines = content.split('\n');
            var len = lines.length;

            for (var i = 0; i < len; i++) {

                try {
                    observer.next(this.makeDoc(JSON.parse(lines[i])));
                } catch (e) {
                    let error: ParserError = e;
                    error.message = M.IMPORTER_FAILURE_INVALIDJSON;
                    error.lineNumber = i + 1;
                    observer.error(error);
                }
            }
            observer.complete();
        });
    }

    private makeDoc(resource) {
        
        return {
            "resource": resource,
            "id": resource['id']
        };
    }

}