import {Observable} from "rxjs/Observable";
import {Document} from "idai-components-2/core";
import {M} from "../m";
import {AbstractParser} from "./abstract-parser";

/**
 * @author Daniel de Oliveira
 */
export class GeojsonParser extends AbstractParser {

    /**
     * The content json must be of a certain structure to
     * get accepted. Any deviance of this structure will lead
     * to a msgWithParams emitted and no document created at all.
     *
     * @param content
     * @returns {any}
     */
    public parse(content: string): Observable<Document> {

        this.warnings = [];
        return Observable.create(observer => {
            let content_;
            try {
                content_ = JSON.parse(content);
            } catch (e) {
                return observer.error([M.IMPORT_FAILURE_INVALIDJSON,e.toString()]);
            }

            const msgWithParams = GeojsonParser.getStructErrors(content_);
            if (msgWithParams != undefined) observer.error(msgWithParams);

            this.iterateDocs(content_,observer);
            observer.complete();
        });
    }

    private iterateDocs(content,observer) {
        for (let i in content['features']) {
            observer.next(this.makeDoc(content['features'][i]));
        }
    }

    private static getStructErrors(content) {
        function structErr(text) {
            return [M.IMPORT_FAILURE_INVALID_GEOJSON_IMPORT_STRUCT,text];
        }

        if (content['type'] != 'FeatureCollection') return structErr('"type":"FeatureCollection" not found at top level.');
        if (content['features'] == undefined) return structErr('Property "features" not found at top level.');

        for (let i in content['features']) {
            if (content['features'][i]['type'] == undefined) return structErr('Property "type" not found for at least one feature.');
            if (content['features'][i]['type'] != 'Feature') return structErr('Second level elements must be of type "Feature".');
            if (['Polygon','Point'].indexOf(content['features'][i]['geometry']['type']) == -1) return structErr('geometry type "'+content['features'][i]['geometry']['type']+'" not supported.');
        }
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