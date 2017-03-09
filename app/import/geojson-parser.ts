import {Observable} from "rxjs/Observable";
import {Document} from "idai-components-2/core";
import {M} from "../m";
import {AbstractParser} from "./abstract-parser";

/**
 * @author Daniel de Oliveira
 */
export class GeojsonParser extends AbstractParser {

    public parse(content: string): Observable<Document> {

        this.warnings = [];
        return Observable.create(observer => {

            let content_;
            try {
                content_ = JSON.parse(content);
            } catch (e) {
                return observer.error([M.IMPORTER_FAILURE_INVALIDJSON,e.toString()]);
            }

            if (content_['type'] != 'FeatureCollection') throw "content type is no feature collection"; // TODO improve
            for (let i in content_['features']) {
                if (content_['features'][i]['type'] != 'Feature') throw "feature type is no feature"; // TODO improve
                observer.next(this.makeDoc(content_['features'][i]));
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