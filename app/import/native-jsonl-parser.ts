import {Injectable} from "@angular/core";
import {Observable} from "rxjs/Observable";
import {Parser} from "./parser";
import {AbstractJsonlParser} from "./abstract-jsonl-parser";
import {Document} from 'idai-components-2/core';

@Injectable()
/**
 * @author Sebastian Cuy
 * @author Jan G. Wieners
 */
export class NativeJsonlParser extends AbstractJsonlParser {

    public parse(content: string): Observable<Document> {
        this.warnings = [];
        return Observable.create(observer => {
            AbstractJsonlParser.parseContent(content,observer,NativeJsonlParser.makeDoc);
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
}