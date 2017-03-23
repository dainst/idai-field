import {Observable} from "rxjs/Observable";
import {Document} from "idai-components-2/core";
import {M} from "../m";
import {AbstractParser} from "./abstract-parser";

export interface Geojson {
    type: string,
    features: Geojson[];
    properties?: any;
    geometry: { type: string };
}

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
            let content_: Geojson;
            try {
                content_ = JSON.parse(content) as Geojson;
            } catch (e) {
                return observer.error([M.IMPORT_FAILURE_INVALIDJSON,e.toString()]);
            }

            const msgWithParams = GeojsonParser.getStructErrors(content_);
            if (msgWithParams != undefined) return observer.error(msgWithParams);

            this.iterateDocs(content_,observer);
            observer.complete();
        });
    }

    private iterateDocs(content: Geojson,observer) {
        for (let i in content.features) {
            observer.next(this.makeDoc(content.features[i]));
        }
    }

    private static getStructErrors(content: Geojson) {
        function structErr(text) {
            return [M.IMPORT_FAILURE_INVALID_GEOJSON_IMPORT_STRUCT,text];
        }

        if (content.type != 'FeatureCollection') return structErr('"type":"FeatureCollection" not found at top level.');
        if (content.features == undefined) return structErr('Property "features" not found at top level.');

        for (let i in content.features) {
            if (content.features[i].properties == undefined
                || content.features[i].properties['identifier'] == undefined)  {
                return [M.IMPORT_FAILURE_MISSING_IDENTIFIER];
            }
            if (typeof content.features[i].properties['identifier'] != 'string')  {
                return [M.IMPORT_FAILURE_IDENTIFIER_FORMAT];
            }
            if (content.features[i].type == undefined) return structErr('Property "type" not found for at least one feature.');
            if (content.features[i].type != 'Feature') return structErr('Second level elements must be of type "Feature".');
            if (['Polygon','Point'].indexOf(content.features[i].geometry.type) == -1) return structErr('geometry type "'+content.features[i].geometry.type+'" not supported.');
        }
    }

    private makeDoc(feature) {
        return {resource: GeojsonParser.makeResource(feature)};
    }

    private static makeResource(feature) {
        return {
            identifier: feature.properties['identifier'],
            geometry: feature.geometry,
            relations: {}
        };
    }
}