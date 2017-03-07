import {Injectable} from "@angular/core";
import {Observable} from "rxjs/Observable";
import {Parser} from "./parser";
import {JsonlParser} from "./jsonl-parser";
import {Document} from 'idai-components-2/core';

@Injectable()
/**
 * @author Sebastian Cuy
 * @author Jan G. Wieners
 */
export class NativeJsonlParser extends JsonlParser implements Parser {

    public parse(content: string): Observable<Document> {

        return Observable.create(observer => {
            JsonlParser.parseContent(content,observer,NativeJsonlParser.makeDoc);
            observer.complete();
        });
    }

    public getWarnings(): string[][] {
        return [];
    }

    private static makeDoc(line) {
        let resource = JSON.parse(line);
        if (!resource.relations) resource.relations = {};
        return {
            resource: resource
        };
    }
}