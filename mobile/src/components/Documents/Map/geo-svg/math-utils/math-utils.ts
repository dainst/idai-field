import { Position } from 'geojson';
import { FieldGeometry } from 'idai-field-core';
import { pointRadius } from '../constants';
import { TransformedDocument } from '../geojson-cs-to-svg-cs/geojson-cs-to-svg-cs';

export const sortDocumentByGeometryArea = (documents: TransformedDocument[]): TransformedDocument[] => {

    return [...documents.sort((doc1,doc2) => {
        const a1 = getGeometryArea({ type: doc1.doc.resource.geometry.type, coordinates: doc1.transformedCoordinates });
        const a2 = getGeometryArea({ type: doc2.doc.resource.geometry.type, coordinates: doc2.transformedCoordinates });
        if(a1 > a2) return -1;
        else if(a1 < a2) return 1;
        else return 0;
    })];
};


const getGeometryArea = (geo: FieldGeometry): number => {
    
    switch(geo.type){
        case 'Point':
        case 'MultiPoint':
            return pointArea();
        case 'LineString':
        case 'MultiLineString':
            return lineArea();
        case 'Polygon':
            return polygonArea(geo.coordinates);
        case 'MultiPolygon':
            return Math.min(...geo.coordinates.map((polygon: Position[][]) => polygonArea(polygon)));
    }
};

/**
 * polygonArea
 * Exterior ring coordinates need to be converted to 'cut' holes in polygon
 * with inner ring coordinates (https://developer.mozilla.org/en-US/docs/Web/SVG/Attribute/fill-rule).
 * Therefore, outer ring coordinates are the area of the polygon. The inner ring coords represent holes and
 * have therefore be subtracted from the area formed by the outer ring coords
 * @param polygon GeoJSON polygon
 * @returns area of the polygon
 */
export const polygonArea = (polygon: Position[][]): number => {
    
    const outerArea = ringCoordinatesArea(polygon[0]);
    let innerAreas = 0;
    for(let i = 1; i < polygon.length; i++){
        innerAreas += ringCoordinatesArea(polygon[i]);
    }
    return outerArea - innerAreas;
};


const ringCoordinatesArea = (lineString: Position[]) => {
    
    let sum = 0;
    const lineStringLength = lineString.length;
    for(let i = 0; i < lineStringLength; i++){
        const [x_i, y_i] = lineString[i];
        const [x_i1, y_i1] = lineString[(i + 1) % lineStringLength];
        sum += x_i * y_i1 - x_i1 * y_i;
    }
    return Math.abs(sum) / 2;
};


export const pointArea = (): number => Math.PI * Math.pow(pointRadius,2);


export const lineArea = (): 0 => 0;