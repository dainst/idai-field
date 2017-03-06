import {Injectable} from "@angular/core";
import {Document} from 'idai-components-2/core'
import {Observable} from "rxjs/Observable";
import {Parser, ParserResult} from "./parser";
import {M} from "../m";

@Injectable()
/**
 * @author Sebastian Cuy
 * @author Jan G. Wieners
 */
export class NativeJsonlParser implements Parser {

    public parse(content: string): Observable<ParserResult> {

        return Observable.create(observer => {

            let lines = content.split('\n');
            let len = lines.length;

            for (let i = 0; i < len; i++) {

                try {
                    if (lines[i].length > 0) {
                        let result: ParserResult = {
                            document: NativeJsonlParser.makeDoc(JSON.parse(lines[i])),
                            messages: []
                        };
                        observer.next(result);
                    }
                } catch (e) {
                    observer.error([M.IMPORTER_FAILURE_INVALIDJSON,i+1]);
                }
            }
            observer.complete();
        });
    }

    private static makeDoc(resource):Document {
        if (!resource.relations) resource.relations = {};
        return {
            "resource": resource
        };
    }

}