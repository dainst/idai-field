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

/**
 * @author Daniel de Oliveira
 * @author Thomas Kleinke
 */
export class GeojsonParser extends AbstractParser {

    /**
     * The content json must be of a certain structure to
     * get accepted. Any deviance of this structure will lead
     * to a msgWithParams emitted and no document created at all.
     *
     * @param content
     * @returns {any}
     * @throws [WRONG_IDENTIFIER_FORMAT]
     * @throws [MISSING_IDENTIFIER]
     * @throws [INVALID_GEOJSON_IMPORT_STRUCT]
     * @throws [FILE_INVALID_JSON]
     * @throws [IMPORT_WARNING_GEOJSON_DUPLICATE_IDENTIFIERS]
     */
    public parse(content: string): Observable<Document> {

        this.warnings = [];
        return Observable.create((observer: Observer<any>) => {
            let content_: Geojson;
            try {
                content_ = JSON.parse(content) as Geojson;
            } catch (e) {
                return observer.error([ImportErrors.FILE_INVALID_JSON, e.toString()]);
            }

            const msgWithParams = GeojsonParser.validate(content_);
            if (msgWithParams != undefined) return observer.error(msgWithParams);

            this.iterateDocs(content_, observer);
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


    private static validate(content: Geojson) {

        const supportedGeometryTypes = [
            'Point', 'MultiPoint', 'LineString', 'MultiLineString', 'Polygon', 'MultiPolygon'
        ];

        function structErr(text: any) {

            return [ImportErrors.INVALID_GEOJSON_IMPORT_STRUCT, text];
        }

        if (content.type != 'FeatureCollection') {
            return structErr('"type": "FeatureCollection" not found at top level.');
        }
        if (content.features == undefined) {
            return structErr('Property "features" not found at top level.');
        }
        for (let feature of content.features) {
            if (feature.properties == undefined
                || feature.properties['identifier'] == undefined)  {
                return [ImportErrors.MISSING_IDENTIFIER];
            }
            if (typeof feature.properties['identifier'] != 'string')  {
                return [ImportErrors.WRONG_IDENTIFIER_FORMAT];
            }
            if (feature.type == undefined) {
                return structErr('Property "type" not found for at least one feature.');
            }
            if (feature.type != 'Feature') {
                return structErr('Second level elements must be of type "Feature".');
            }
            if (supportedGeometryTypes.indexOf(feature.geometry.type) == -1) {
                return structErr('geometry type "' + feature.geometry.type + '" not supported.');
            }
        }
    }


    private addDuplicateIdentifierWarnings(identifiers: string[]) {

        const duplicateIdentifiers: string[] = duplicates(identifiers);
        if (duplicateIdentifiers.length == 1) {
            this.warnings.push([M.IMPORT_WARNING_GEOJSON_DUPLICATE_IDENTIFIER, duplicateIdentifiers[0]]);
        } else if (duplicateIdentifiers.length > 1) {
            this.warnings.push([M.IMPORT_WARNING_GEOJSON_DUPLICATE_IDENTIFIERS, duplicateIdentifiers.join(', ')]);
        }
    }


    private static makeDoc(feature: any) {

        return {
            resource: {
                identifier: feature.properties['identifier'],
                geometry: feature.geometry,
                relations: {}
            }
        }
    }
}