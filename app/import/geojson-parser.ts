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

            const msgWithParams = GeojsonParser.getStructErrors(content_);
            if (msgWithParams != undefined) observer.error(msgWithParams);

            this.iterateDocs(content_,observer);
            observer.complete();
        });
    }

    private iterateDocs(content,observer) {
        for (let i in content['features']) {
            if (content['features'][i]['type'] != 'Feature') throw "feature type is no feature"; // TODO improve
            observer.next(this.makeDoc(content['features'][i]));
        }
    }

    private static getStructErrors(content) {
        if (content['type'] != 'FeatureCollection') return [M.IMPORTER_FAILURE_INVALID_GEOJSON_IMPORT_STRUCT,'"type":"FeatureCollection" not found at top level.'];
        if (content['features'] == undefined) return [M.IMPORTER_FAILURE_INVALID_GEOJSON_IMPORT_STRUCT,'Property "features" not found at top level.'];
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