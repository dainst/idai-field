import { Feature, FeatureCollection, GeometryObject } from 'geojson';
import { FieldDocument, FieldGeometry, Query, ObjectUtils, Datastore } from 'idai-field-core';
import { M } from '../../components/messages/m';
import { getAsynchronousFs } from '../../services/get-asynchronous-fs';

const geojsonRewind = window.require('@mapbox/geojson-rewind');


/**
 * @author Thomas Kleinke
 */
export module GeoJsonExporter {

    export async function performExport(datastore: Datastore, outputFilePath: string,
                                        operationId: string): Promise<void> {

        const documents: Array<FieldDocument> = await getGeometryDocuments(datastore, operationId);
        const featureCollection: FeatureCollection<GeometryObject> = createFeatureCollection(documents);

        return writeFile(outputFilePath, featureCollection);
    }


    async function getGeometryDocuments(datastore: Datastore,
                                        operationId: string): Promise<Array<FieldDocument>> {

        const query: Query = createQuery(operationId);
        const result = await datastore.find(query);
        return result.documents as Array<FieldDocument>;
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


    function createFeatureCollection(documents: Array<FieldDocument>): FeatureCollection<GeometryObject> {

        const featureCollection: FeatureCollection<GeometryObject> = {
            type: 'FeatureCollection',
            features: documents.map(createFeature)
        };

        geojsonRewind(featureCollection);

        return featureCollection;
    }


    function createFeature(document: FieldDocument): Feature<GeometryObject> {

        return {
            type: 'Feature',
            geometry: getGeometry(document),
            properties: getProperties(document)
        };
    }


    async function writeFile(outputFilePath: string,
                       featureCollection: FeatureCollection<GeometryObject>): Promise<void> {

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


    function getProperties(document: FieldDocument): any {

        const properties: any = {
            identifier: document.resource.identifier,
            shortDescription: document.resource.shortDescription,
            category: document.resource.category
        };

        if (!properties.shortDescription) delete properties.shortDescription;

        return properties;
    }
}
