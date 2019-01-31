import * as fs from 'fs';
import {Feature, FeatureCollection, GeometryObject} from 'geojson';
import {jsonClone} from 'tsfun';
import {IdaiFieldDocument, IdaiFieldGeometry, Query} from 'idai-components-2';
import {FieldReadDatastore} from '../datastore/field/field-read-datastore';
import {M} from '../../components/m';

const geojsonRewind = require('geojson-rewind');


/**
 * @author Thomas Kleinke
 */
export module GeoJsonExporter {

    export async function performExport(datastore: FieldReadDatastore, outputFilePath: string,
                                        operationId: string): Promise<void> {

        const documents: Array<IdaiFieldDocument> = await getGeometryDocuments(datastore, operationId);
        const featureCollection: FeatureCollection<GeometryObject> = createFeatureCollection(documents);

        return writeFile(outputFilePath, featureCollection);
    }


    async function getGeometryDocuments(datastore: FieldReadDatastore,
                                        operationId: string): Promise<Array<IdaiFieldDocument>> {

        const query: Query = createQuery(operationId);
        return (await datastore.find(query)).documents;
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


    function createFeatureCollection(documents: Array<IdaiFieldDocument>): FeatureCollection<GeometryObject> {

        const featureCollection: FeatureCollection<GeometryObject> = {
            type: 'FeatureCollection',
            features: documents.map(createFeature)
        };

        geojsonRewind(featureCollection);

        return featureCollection;
    }


    function createFeature(document: IdaiFieldDocument): Feature<GeometryObject> {

        return {
            type: 'Feature',
            geometry: getGeometry(document),
            properties: getProperties(document)
        };
    }


    function writeFile(outputFilePath: string,
                       featureCollection: FeatureCollection<GeometryObject>): Promise<void> {

        const json: string = JSON.stringify(featureCollection, null, 2);

        return new Promise((resolve, reject) => {
            fs.writeFile(outputFilePath, json, (err: any) => {
                if (err) {
                    console.error(err);
                    reject([M.EXPORT_GEOJSON_ERROR_WRITE]);
                } else {
                    resolve();
                }
            });
        });
    }


    function getGeometry(document: IdaiFieldDocument): GeometryObject {

        return {
            type: (document.resource.geometry as IdaiFieldGeometry).type,
            coordinates: getCoordinates(document.resource.geometry as IdaiFieldGeometry)
        };
    }


    function getCoordinates(geometry: IdaiFieldGeometry): any {

        const coordinates: any = jsonClone(geometry.coordinates);

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


    function getProperties(document: IdaiFieldDocument): any {

        const properties: any = {
            identifier: document.resource.identifier,
            shortDescription: document.resource.shortDescription,
            type: document.resource.type
        };

        if (!properties.shortDescription) delete properties.shortDescription;

        return properties;
    }
}