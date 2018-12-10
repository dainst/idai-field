import {Observable, Observer} from 'rxjs';
import {duplicates} from 'tsfun';
import {Document} from 'idai-components-2';
import {AbstractParser} from './abstract-parser';
import {M} from '../../components/m';
import {ImportErrors} from './import-errors';

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
export class GeojsonParser extends AbstractParser {

    private static supportedGeometryTypes = [
        'Point', 'MultiPoint', 'LineString', 'MultiLineString', 'Polygon', 'MultiPolygon'
    ];


    constructor(private preValidateAndTransform: Function|undefined,
                private postProcess: Function|undefined) {super()}


    /**
     * The content json must be of a certain structure to
     * get accepted. Any deviance of this structure will lead
     * to a msgWithParams emitted and no document created at all.
     *
     * @param content
     * @throws [WRONG_IDENTIFIER_FORMAT]
     * @throws [PARSER_MISSING_IDENTIFIER]
     * @throws [PARSER_INVALID_GEOJSON_IMPORT_STRUCT]
     * @throws [PARSER_FILE_INVALID_JSON]
     * @throws [IMPORT_WARNING_GEOJSON_DUPLICATE_IDENTIFIERS]
     */
    public parse(content: string): Observable<Document> {

        this.warnings = [];
        return Observable.create((observer: Observer<any>) => {
            let geojson: Geojson;
            try {
                geojson = JSON.parse(content) as Geojson;
            } catch (e) {
                return observer.error([ImportErrors.PARSER_FILE_INVALID_JSON, e.toString()]);
            }

            const msgWithParams = GeojsonParser.validateAndTransform(geojson, this.preValidateAndTransform);
            if (msgWithParams !== undefined) return observer.error(msgWithParams);

            if (this.postProcess) this.postProcess(geojson); // TODO use it to actually validate the input. for now it only logs results

            this.iterateDocs(geojson, observer);
            observer.complete();
        });
    }


    private iterateDocs(content: Geojson, observer: Observer<any>) {

        const identifiers: string[] = [];

        for (let feature of content.features) {
            const document: any = GeojsonParser.makeDoc(feature);
            identifiers.push(document.resource.identifier);
            observer.next(document);
        }

        this.addDuplicateIdentifierWarnings(identifiers); // TODO remove
    }


    /**
     * Validate and transform (modify in place) in one pass to reduce runtime.
     */
    private static validateAndTransform(geojson: Geojson, preValidateAndTransformFeature: Function|undefined) {

        if (geojson.type !== 'FeatureCollection') return [
            ImportErrors.PARSER_INVALID_GEOJSON_IMPORT_STRUCT, '"type": "FeatureCollection" not found at top level.'];

        if (geojson.features === undefined) return [
            ImportErrors.PARSER_INVALID_GEOJSON_IMPORT_STRUCT, 'Property "features" not found at top level.'];

        let identifiers: string[] = [];
        for (let feature of geojson.features) {

            if (!feature.properties) return [ImportErrors.PARSER_MISSING_IDENTIFIER];
            feature.properties.relations = {};

            if (preValidateAndTransformFeature) {
                const msgWithParams = preValidateAndTransformFeature(feature, identifiers);
                if (msgWithParams) return msgWithParams;
            }

            const msgWithParams = this.validateAndTransformFeature(feature);
            if (msgWithParams) return msgWithParams;
        }
    }


    private static validateAndTransformFeature(feature: any) {

        if (!feature.properties['identifier']) return [ImportErrors.PARSER_MISSING_IDENTIFIER];
        if (typeof feature.properties['identifier'] !== 'string') return [ImportErrors.WRONG_IDENTIFIER_FORMAT];

        if (feature.type === undefined) return [ImportErrors.PARSER_INVALID_GEOJSON_IMPORT_STRUCT, 'Property "type" not found for at least one feature.'];
        if (feature.type !== 'Feature') return [ImportErrors.PARSER_INVALID_GEOJSON_IMPORT_STRUCT, 'Second level elements must be of type "Feature".'];

        if (feature.geometry && feature.geometry.type
            && GeojsonParser.supportedGeometryTypes.indexOf(feature.geometry.type) === -1) {

            return [ImportErrors.PARSER_INVALID_GEOJSON_IMPORT_STRUCT, 'geometry type "' + feature.geometry.type + '" not supported.'];
        }
    }


    private addDuplicateIdentifierWarnings(identifiers: string[]) {

        const duplicateIdentifiers: string[] = duplicates(identifiers);
        if (duplicateIdentifiers.length === 1) {
            this.warnings.push([M.IMPORT_WARNING_GEOJSON_DUPLICATE_IDENTIFIER, duplicateIdentifiers[0]]);
        } else if (duplicateIdentifiers.length > 1) {
            this.warnings.push([M.IMPORT_WARNING_GEOJSON_DUPLICATE_IDENTIFIERS, duplicateIdentifiers.join(', ')]);
        }
    }


    private static makeDoc(feature: any) {

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