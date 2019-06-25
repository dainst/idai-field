import {Observable, Observer} from 'rxjs';
import {Document} from 'idai-components-2';
import {ParserErrors} from './parser-errors';
import {Parser} from './parser';

export interface Geojson {
    type: string,
    features: Geojson[];
    properties?: any;
    geometry: { type: string };
}

export interface GazetteerProperties {
    prefName: {
        title: string;
    };
    identifier: string;
    id: string;
    gazId: string;
    type: string;
    geometry: { type: string };
    parent: string;
    relations: any;
}


/**
 * This parser is in part optimized to handle the iDAI.welt specific geojson format well.
 *
 * @author Daniel de Oliveira
 * @author Thomas Kleinke
 */
export module GeojsonParser {

    const supportedGeometryTypes = [
        'Point', 'MultiPoint', 'LineString', 'MultiLineString', 'Polygon', 'MultiPolygon'
    ];


    /**
     * @param preValidateAndTransform
     * @param postProcess
     */
    export function getParse(preValidateAndTransform: Function|undefined,
                    postProcess: Function|undefined): Parser {

        /**
         * The content json must be of a certain structure to
         * get accepted. Any deviance of this structure will lead
         * to a msgWithParams emitted and no document created at all.
         *
         * @throws [WRONG_IDENTIFIER_FORMAT]
         * @throws [MISSING_IDENTIFIER]
         * @throws [INVALID_GEOJSON_IMPORT_STRUCT]
         * @throws [FILE_INVALID_JSON]
         * @throws [IMPORT_WARNING_GEOJSON_DUPLICATE_IDENTIFIERS]
         */
        return (content: string): Observable<Document> => {

            return Observable.create((observer: Observer<any>) => {
                let geojson: Geojson;
                try {
                    geojson = JSON.parse(content) as Geojson;
                } catch (e) {
                    return observer.error([ParserErrors.FILE_INVALID_JSON, e.toString()]);
                }

                const msgWithParams = validateAndTransform(geojson, preValidateAndTransform);
                if (msgWithParams !== undefined) return observer.error(msgWithParams);

                if (postProcess) postProcess(geojson);

                iterateDocs(geojson, observer);
                observer.complete();
            });
        }
    }


    function iterateDocs(content: Geojson, observer: Observer<any>) {

        for (let feature of content.features) {
            const document: any = makeDoc(feature);
            observer.next(document);
        }
    }


    /**
     * Validate and transform (modify in place) in one pass to reduce runtime.
     */
    function validateAndTransform(geojson: Geojson, preValidateAndTransformFeature: Function|undefined) {

        if (geojson.type !== 'FeatureCollection') return [
            ParserErrors.INVALID_GEOJSON_IMPORT_STRUCT, '"type": "FeatureCollection" not found at top level.'];

        if (geojson.features === undefined) return [
            ParserErrors.INVALID_GEOJSON_IMPORT_STRUCT, 'Property "features" not found at top level.'];

        let identifiers: string[] = [];
        for (let feature of geojson.features) {

            if (!feature.properties) return [ParserErrors.MISSING_IDENTIFIER];
            feature.properties.relations = {};

            if (preValidateAndTransformFeature) {
                const msgWithParams = preValidateAndTransformFeature(feature, identifiers);
                if (msgWithParams) return msgWithParams;
            }

            const msgWithParams = validateAndTransformFeature(feature);
            if (msgWithParams) return msgWithParams;
        }
    }


    function validateAndTransformFeature(feature: any) {

        if (!feature.properties['identifier']) return [ParserErrors.MISSING_IDENTIFIER];
        if (typeof feature.properties['identifier'] !== 'string') return [ParserErrors.WRONG_IDENTIFIER_FORMAT];

        if (feature.type === undefined) return [ParserErrors.INVALID_GEOJSON_IMPORT_STRUCT, 'Property "type" not found for at least one feature.'];
        if (feature.type !== 'Feature') return [ParserErrors.INVALID_GEOJSON_IMPORT_STRUCT, 'Second level elements must be of type "Feature".'];

        if (feature.geometry && feature.geometry.type
            && supportedGeometryTypes.indexOf(feature.geometry.type) === -1) {

            return [ParserErrors.INVALID_GEOJSON_IMPORT_STRUCT, 'geometry type "' + feature.geometry.type + '" not supported.'];
        }
    }


    function makeDoc(feature: any) {

        const resource = {
            identifier: feature.properties['identifier'],
            geometry: feature.geometry,
            relations: feature.properties.relations,
            type: feature.properties['type'],
            shortDescription: feature.properties['shortDescription']
        };
        if (feature.properties['gazId']) (resource as any)['gazId'] = feature.properties['gazId'];
        if (feature.properties['id']) (resource as any)['id'] = feature.properties['id'];

        return {resource: resource}
    }
}