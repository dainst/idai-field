import { Document } from 'idai-field-core';
import { ParserErrors } from './parser-errors';
import { Parser } from './parser';


export interface Geojson {

    type: string,
    features: Geojson[];
    properties?: any;
    geometry: { type: string };
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
    export function getParse(preValidateAndTransform?: Function, postProcess?: Function): Parser {

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
        return (content: string): Promise<Array<Document>> => {

            return new Promise((resolve: Function, reject: Function) => {
                let geojson: Geojson;
                try {
                    geojson = JSON.parse(content) as Geojson;
                } catch (e) {
                    return reject([ParserErrors.FILE_INVALID_JSON, e.toString()]);
                }

                const msgWithParams = validateAndTransform(geojson, preValidateAndTransform);
                if (msgWithParams !== undefined) return reject(msgWithParams);

                if (postProcess) postProcess(geojson);

                resolve(iterateDocs(geojson));
            });
        }
    }


    function iterateDocs(content: Geojson): Array<Document> {

        const docs: Array<Document> = [];
        for (let feature of content.features) {
            const document: any = createDocument(feature);
            docs.push(document);
        }
        return docs;
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

        if (feature.type === undefined) {
            return [ParserErrors.INVALID_GEOJSON_IMPORT_STRUCT, 'Property "type" not found for at least one feature.'];
        } else if (feature.type !== 'Feature') {
            return [ParserErrors.INVALID_GEOJSON_IMPORT_STRUCT, 'Second level elements must be of type "Feature".'];
        } else if (feature.geometry && feature.geometry.type
                && supportedGeometryTypes.indexOf(feature.geometry.type) === -1) {
            return [
                ParserErrors.INVALID_GEOJSON_IMPORT_STRUCT,
                'geometry type "' + feature.geometry.type + '" not supported.'
            ];
        }
    }


    function createDocument(feature: any): any {

        const resource: any = {
            identifier: feature.properties['identifier'],
            geometry: feature.geometry
        };

        if (feature.properties['gazId']) resource.gazId = feature.properties['gazId'];
        if (feature.properties['id']) resource.id = feature.properties['id'];

        return { resource: resource };
    }
}
