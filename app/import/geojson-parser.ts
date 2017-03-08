import {Injectable} from "@angular/core";
import {Observable} from "rxjs/Observable";
import {Document} from "idai-components-2/core";
import {M} from "../m";
import {AbstractParser} from "./abstract-parser";

@Injectable()
/**
 * @author Daniel de Oliveira
 */
export class GeojsonParser extends AbstractParser {

    public parse(content: string): Observable<Document> {

        this.warnings = [];
        return Observable.create(observer => {

            let con;
            try {
                con = JSON.parse(content);
            } catch (e) {
                console.error('parse content error. reason: ',e);
                observer.error([M.IMPORTER_FAILURE_INVALIDJSON]); // TODO add param
            }

            if (con['type'] != 'FeatureCollection') throw "content type is no feature collection"; // TODO improve
            for (let i in con['features']) {
                if (con['features'][i]['type'] != 'Feature') throw "feature type is no feature"; // TODO improve
                observer.next(this.makeDoc(con['features'][i]));
            }

            observer.complete();
        });
    }

    private makeDoc(feature) {
        return {resource: GeojsonParser.makeResource(feature)};
    }

    private static makeResource(feature) {
        return {
            identifier: feature['properties']['identifier'],
            geometry: feature['geometry'],
            relations: {}
        };
    }
}