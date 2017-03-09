import {Observable} from "rxjs/Observable";
import {Document} from "idai-components-2/core";
import {M} from "../m";
import {AbstractParser} from "./abstract-parser";

/**
 * @author Sebastian Cuy
 * @author Jan G. Wieners
 */
export class NativeJsonlParser extends AbstractParser {

    public parse(content: string): Observable<Document> {
        this.warnings = [];
        return Observable.create(observer => {
            NativeJsonlParser.parseContent(content,observer,NativeJsonlParser.makeDoc);
            observer.complete();
        });
    }

    private static makeDoc(line) {
        let resource = JSON.parse(line);
        if (!resource.relations) resource.relations = {};
        return {
            resource: resource
        };
    }

    private static parseContent(content,observer,makeDocFun) {

        let lines = content.split('\n');
        let len = lines.length;

        for (let i = 0; i < len; i++) {

            try {

                if (lines[i].length > 0) observer.next(makeDocFun(lines[i]))

            } catch (e) {
                console.error('parse content error. reason: ',e);
                observer.error([M.IMPORTER_FAILURE_INVALIDJSON,i+1]);
            }
        }
    }
}