import {Injectable} from "@angular/core";
import {Observable} from "rxjs/Observable";
import {Parser} from "./parser";
import {JsonlParser} from "./jsonl-parser";
import {Document} from 'idai-components-2/core'

@Injectable()
/**
 * @author Daniel de Oliveira
 */
export class GeojsonJsonlParser extends JsonlParser implements Parser {

    public parse(content: string): Observable<Document> {
        return Observable.create(observer => {
            JsonlParser.parseContent(content,observer,GeojsonJsonlParser.makeDoc);
            observer.complete();
        });
    }

    private static makeDoc(line) {
        let lineItem = JSON.parse(line);
        let resource = {
            identifier: lineItem['properties']['identifier'],
            geometries: [lineItem['geometry']],
            relations: {}
        };
        return {resource: resource};
    }

}