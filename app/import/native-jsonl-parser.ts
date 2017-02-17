import {Injectable} from "@angular/core";
import {Observable} from "rxjs/Observable";
import {Document} from "idai-components-2/core";
import {Parser,ParserError} from "./parser";
import {M} from "../m";

/**
 * @author Sebastian Cuy
 * @author Jan G. Wieners
 */
@Injectable()
export class NativeJsonlParser implements Parser {

    public parse(content: string): Observable<Document> {

        return Observable.create(observer => {

            let lines = content.split('\n');
            let len = lines.length;

            for (let i = 0; i < len; i++) {

                try {
                    if (lines[i].length > 0) {
                        observer.next(NativeJsonlParser.makeDoc(JSON.parse(lines[i])));
                    }
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

    private static makeDoc(resource) {

        if (!resource.relations) resource.relations = {};
        
        return {
            "resource": resource,
            "id": resource['id']
        };
    }

}