import { SimpleChanges } from '@angular/core';
import { flatten, subtract } from 'tsfun';
import { FieldDocument, FieldGeometry, FieldResource } from 'idai-field-core';
import { CoordinatesUtility } from './coordinates-utility';


/**
 * @author Thomas Kleinke
 * @author Daniel de Oliveira
 */
export module MapComponentHelper {

    export function addToBounds(markers: { [id: string]: Array<L.CircleMarker> },
                                polygons: { [id: string]: Array<L.Polygon> },
                                polylines: { [id: string]: Array<L.Polyline> },
                                documents: Array<FieldDocument>): Array<L.LatLng> {

        const allBounds: any = [];

        for (const document of documents) {

            const bounds: any = [];
            const id = document.resource.id;

            if (polygons[id]) {
                polygons[id].forEach(polygon => bounds.push(polygon.getLatLngs()[0]));
            } else if (polylines[id]) {
                polylines[id].forEach(polyline => bounds.push(polyline.getLatLngs()));
            } else if (markers[id]) {
                markers[id].forEach(marker => bounds.push(marker.getLatLng()));
            }

            allBounds.push(...bounds);
        }

        return flatten(1, allBounds);
    }


    export function getGeometry(document: FieldDocument): FieldGeometry|undefined {

        const geometry: FieldGeometry|undefined = document.resource.geometry;

        return geometry?.coordinates && geometry.coordinates.length > 0
            ? geometry
            : undefined;
    }

    export function getSideviewGeometry(document: FieldDocument, parentDocument: FieldDocument): FieldGeometry | undefined {
        console.log('getSideviewGeometry', document, parentDocument);
        if (!document.resource.sideviewgeometry) return undefined;
        const parentDocumentId = parentDocument.resource.id;
        if (!document.resource.sideviewgeometry[parentDocumentId]) return undefined;
        const geometry = document.resource.sideviewgeometry[parentDocumentId];

        return geometry?.coordinates && geometry.coordinates.length > 0
            ? geometry
            : undefined;
    }

    export function hasGeometries(documents: Array<FieldDocument>): boolean {

        return documents.find(getGeometry) !== undefined;
    }


    export function getPolylineFromCoordinates(coordinates: Array<any>): L.Polyline {

        return L.polyline(<any> CoordinatesUtility.convertPolylineCoordinatesFromLngLatToLatLng(coordinates));
    }


    export function getPolygonFromCoordinates(coordinates: Array<any>): L.Polygon {

        return L.polygon(<any> CoordinatesUtility.convertPolygonCoordinatesFromLngLatToLatLng(coordinates));
    }


    export function getTooltipText(resource: FieldResource) {

        let shortDescription = resource.identifier;
        if (resource.shortDescription && Number(resource.shortDescription.length) > 0) {
            shortDescription += ' | ' + resource.shortDescription;
        }

        return shortDescription;
    }


    export function hasOnlySelectionChanged(changes: SimpleChanges): boolean {

        return (changes['selectedDocument'] || changes['additionalSelectedDocuments'])
            && !changes['documents'] && !changes['parentDocument']
            && !changes['coordinateReferenceSystem'];
    }


    export function getPreviousSelection(changes: SimpleChanges): Array<FieldDocument> {

        const result = changes['selectedDocument']?.previousValue
            ? [changes['selectedDocument'].previousValue]
            : [];

        return changes['additionalSelectedDocuments'].previousValue
            ? result.concat(changes['additionalSelectedDocuments'].previousValue)
            : result;
    }


    export function getDeselectedDocuments(currentSelection: Array<FieldDocument>,
                                          previousSelection: Array<FieldDocument>): Array<FieldDocument> {

        return subtract(currentSelection)(previousSelection);
    }
}
