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

    private static placePath = 'https://gazetteer.dainst.org/place/';


    constructor(private gazetteerMode = false) {super()}


    /**
     * The content json must be of a certain structure to
     * get accepted. Any deviance of this structure will lead
     * to a msgWithParams emitted and no document created at all.
     *
     * @param content
     * @throws [WRONG_IDENTIFIER_FORMAT]
     * @throws [MISSING_IDENTIFIER]
     * @throws [INVALID_GEOJSON_IMPORT_STRUCT]
     * @throws [FILE_INVALID_JSON]
     * @throws [IMPORT_WARNING_GEOJSON_DUPLICATE_IDENTIFIERS]
     */
    public parse(content: string): Observable<Document> {

        this.warnings = [];
        return Observable.create((observer: Observer<any>) => {
            let geojson: Geojson;
            try {
                geojson = JSON.parse(content) as Geojson;
            } catch (e) {
                return observer.error([ImportErrors.FILE_INVALID_JSON, e.toString()]);
            }

            const msgWithParams = GeojsonParser.validateAndTransform(geojson, this.gazetteerMode);
            if (msgWithParams !== undefined) return observer.error(msgWithParams);

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

        this.addDuplicateIdentifierWarnings(identifiers);
    }


    /**
     * Validate and transform (modify in place) in one pass to reduce runtime.
     */
    private static validateAndTransform(geojson: Geojson, gazetteerMode: boolean) {

        if (geojson.type !== 'FeatureCollection') {
            return [ImportErrors.INVALID_GEOJSON_IMPORT_STRUCT, '"type": "FeatureCollection" not found at top level.'];
        }
        if (geojson.features == undefined) {
            return [ImportErrors.INVALID_GEOJSON_IMPORT_STRUCT, 'Property "features" not found at top level.'];
        }

        for (let feature of geojson.features) {

            if (!feature.properties) return [ImportErrors.MISSING_IDENTIFIER];
            feature.properties.relations = {};

            if (gazetteerMode) {
                const msgWithParams = this.validateAndtransformFeatureGazetteer(feature);
                if (msgWithParams) return msgWithParams;
            }

            const msgWithParams = this.validateAndTransformFeature(feature);
            if (msgWithParams) return msgWithParams;
        }
    }


    private static validateAndTransformFeature(feature: any) {

        if (!feature.properties['identifier']) return [ImportErrors.MISSING_IDENTIFIER];
        if (typeof feature.properties['identifier'] !== 'string') return [ImportErrors.WRONG_IDENTIFIER_FORMAT];

        if (feature.type === undefined) return [ImportErrors.INVALID_GEOJSON_IMPORT_STRUCT, 'Property "type" not found for at least one feature.'];
        if (feature.type !== 'Feature') return [ImportErrors.INVALID_GEOJSON_IMPORT_STRUCT, 'Second level elements must be of type "Feature".'];

        if (GeojsonParser.supportedGeometryTypes.indexOf(feature.geometry.type) === -1) {
            return [ImportErrors.INVALID_GEOJSON_IMPORT_STRUCT, 'geometry type "' + feature.geometry.type + '" not supported.'];
        }
    }


    private static validateAndtransformFeatureGazetteer(feature: any) {

        const properties: GazetteerProperties = feature.properties as GazetteerProperties;

        if (!properties.gazId) return [ImportErrors.INVALID_GEOJSON_IMPORT_STRUCT, 'Property "properties.gazId" not found for at least one feature.'];
        properties.identifier = properties.gazId;
        if (properties.prefName && properties.prefName.title) {
            properties.identifier = properties.identifier = properties.prefName.title + '(' + properties.gazId + ')';
        }


        properties.id = properties.gazId;

        properties.type = 'Place';

        if (properties.parent) properties.relations['liesWithin'] = [
            (feature.properties.parent as any).replace(GeojsonParser.placePath, '')];

        if (feature.geometry.type === 'GeometryCollection') this.transformGeometryCollection(feature);
    }


    private static transformGeometryCollection(feature: any) {

        const geometries = (feature.geometry as any)['geometries'];

        const nrPoints = geometries.filter((_: any) => _.type === 'Point').length;
        const nrGeometries = geometries.length;

        if (nrGeometries > 0) {

            feature.geometry = nrGeometries > nrPoints
                ? geometries.find(((_: any) => _.type !== 'Point'))
                : geometries[0];

        } else {

            delete feature.geometry;
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

        return {
            resource: {
                id: feature.properties['id'], // TODO, will we do that one here?
                identifier: feature.properties['identifier'],
                geometry: feature.geometry,
                relations: feature.properties.relations,
                type: feature.properties['type']
            }
        }
    }
}