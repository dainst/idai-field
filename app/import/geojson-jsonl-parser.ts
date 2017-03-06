import {Injectable} from "@angular/core";
import {Document} from 'idai-components-2/core'
import {Observable} from "rxjs/Observable";
import {Parser, ParserResult} from "./parser";
import {M} from "../m";
import {JsonlParser} from "./jsonl-parser";

@Injectable()
/**
 * @author Daniel de Oliveira
 */
export class GeojsonJsonlParser extends JsonlParser implements Parser {

    public parse(content: string): Observable<ParserResult> {
        return Observable.create(observer => {
            JsonlParser.parseContent(content,observer,GeojsonJsonlParser.makeDoc);
            observer.complete();
        });
    }

    private static makeDoc(line) {
        let lineItem = JSON.parse(line);
        let resource = {
            identifier: lineItem['properties']['identifier'],
            relations: {}
        };
        return {
            document: {resource: resource},
            messages: []
        };
    }

}