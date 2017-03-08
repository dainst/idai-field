import {Injectable} from "@angular/core";
import {Observable} from "rxjs/Observable";
import {AbstractJsonlParser} from "./abstract-jsonl-parser";
import {Document} from "idai-components-2/core";

@Injectable()
/**
 * @author Daniel de Oliveira
 */
export class GeojsonJsonlParser extends AbstractJsonlParser {

    public parse(content: string): Observable<Document> {
        this.warnings = [];
        return Observable.create(observer => {
            AbstractJsonlParser.parseContent(content,observer,GeojsonJsonlParser.makeDoc);
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