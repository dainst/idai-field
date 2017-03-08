import {Injectable} from "@angular/core";
import {Observable} from "rxjs/Observable";
import {AbstractJsonlParser} from "./abstract-jsonl-parser";
import {Document} from "idai-components-2/core";
import {M} from "../m";

@Injectable()
/**
 * @author Daniel de Oliveira
 */
export class GeojsonJsonlParser extends AbstractJsonlParser {

    public parse(content: string): Observable<Document> {
        this.warnings = [];
        return Observable.create(observer => {
            AbstractJsonlParser.parseContent(content,observer,this.makeDoc.bind(this));
            observer.complete();
        });
    }

    private makeDoc(line) {
        let lineItem = JSON.parse(line);

        if (lineItem['type'] == 'FeatureCollection') {
            if (lineItem['features'].length == 0) {
                throw "no geometry"; // TODO improve
            } else {
                this.addToWarnings(M.IMPORTER_WARNING_NOMULTIPOLYGONSUPPORT);
                lineItem = lineItem['features'][0];
            }
        }
        return {resource: GeojsonJsonlParser.makeResource(lineItem)};
    }

    private static makeResource(lineItem) {
        return {
            identifier: lineItem['properties']['identifier'],
            geometries: [lineItem['geometry']],
            relations: {}
        };
    }
}