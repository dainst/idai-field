import { Feature, FeatureCollection, GeometryObject } from 'geojson';
import { isObject } from 'tsfun';
import { FieldDocument, FieldGeometry, Query, ObjectUtils, Datastore, FieldGeometryType, I18N } from 'idai-field-core';
import { M } from '../../components/messages/m';
import { getAsynchronousFs } from '../../services/get-asynchronous-fs';

const geojsonRewind = window.require('@mapbox/geojson-rewind');


/**
 * @author Thomas Kleinke
 */
export module GeoJsonExporter {

    export async function performExport(datastore: Datastore, outputFilePath: string, operationId: string,
                                        explodeShortDescription: boolean = false,
                                        geometryTypes?: Array<FieldGeometryType>) {

        const documents: Array<FieldDocument> = await getGeometryDocuments(datastore, operationId, geometryTypes);
        const featureCollection: FeatureCollection<GeometryObject> = createFeatureCollection(documents, explodeShortDescription);

        return writeFile(outputFilePath, featureCollection);
    }


    async function getGeometryDocuments(datastore: Datastore, operationId: string,
                                        geometryTypes?: Array<FieldGeometryType>): Promise<Array<FieldDocument>> {

        const query: Query = createQuery(operationId);
        const result: Datastore.FindResult = await datastore.find(query);
        const documents: Array<FieldDocument> = result.documents as Array<FieldDocument>;

        return geometryTypes
            ? documents.filter(document => geometryTypes.includes(document.resource.geometry.type))
            : documents;
    }


    function createQuery(operationId: string): Query {

        const query: Query = {
            q: '',
            constraints: {
                'geometry:exist': 'KNOWN'
            }
        };

        if (operationId !== 'project') (query.constraints as any)['isRecordedIn:contain'] = operationId;

        return query;
    }


    function createFeatureCollection(documents: Array<FieldDocument>,
                                     explodeShortDescription: boolean): FeatureCollection<GeometryObject> {

        const featureCollection: FeatureCollection<GeometryObject> = {
            type: 'FeatureCollection',
            features: documents.map(document => createFeature(document, explodeShortDescription))
        };

        geojsonRewind(featureCollection);

        return featureCollection;
    }


    function createFeature(document: FieldDocument, explodeShortDescription: boolean): Feature<GeometryObject> {

        return {
            type: 'Feature',
            geometry: getGeometry(document),
            properties: getProperties(document, explodeShortDescription)
        };
    }


    async function writeFile(outputFilePath: string,
                             featureCollection: FeatureCollection<GeometryObject>) {

        const json: string = JSON.stringify(featureCollection, null, 2);

        try {
            await getAsynchronousFs().writeFile(outputFilePath, json);
        } catch (err) {
            console.error('Error while trying to write file: ' + outputFilePath, err);
            throw [M.EXPORT_GEOJSON_ERROR_WRITE];
        }
    }


    function getGeometry(document: FieldDocument): GeometryObject {

        return {
            type: (document.resource.geometry as FieldGeometry).type,
            coordinates: getCoordinates(document.resource.geometry as FieldGeometry)
        };
    }


    function getCoordinates(geometry: FieldGeometry): any {

        const coordinates: any = ObjectUtils.jsonClone(geometry.coordinates);

        if (geometry.type === 'Polygon') {
            closeRings(coordinates);
        } else if (geometry.type === 'MultiPolygon') {
            coordinates.forEach(closeRings);
        }

        return coordinates;
    }


    function closeRings(polygonCoordinates: number[][][]) {

        polygonCoordinates.forEach(ring => {
           if (ring[0][0] !== ring[ring.length - 1][0] || ring[0][1] !== ring[ring.length - 1][1]) {
               ring.push([ring[0][0], ring[0][1]]);
           }
        });
    }


    function getProperties(document: FieldDocument, explodeShortDescription: boolean): any {

        const properties: any = {
            identifier: document.resource.identifier,
            category: document.resource.category
        };

        addShortDescription(properties, document, explodeShortDescription);

        return properties;
    }


    function addShortDescription(properties: any, document: FieldDocument, explodeShortDescription: boolean) {

        const shortDescription: I18N.String|string = document.resource.shortDescription;
        if (!shortDescription) return;

        if (explodeShortDescription) {
            if (isObject(shortDescription)) {
                Object.keys(shortDescription).forEach(languageCode => {
                    const suffix: string = languageCode !== I18N.UNSPECIFIED_LANGUAGE
                        ? '_' + languageCode
                        : '';
                    properties['sdesc' + suffix] = shortDescription[languageCode];
                });
            } else {
                properties['sdesc'] = shortDescription;
            }
        } else {
            properties.shortDescription = shortDescription;
        }
    }
}
