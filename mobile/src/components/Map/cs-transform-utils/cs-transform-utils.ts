import { Position } from 'geojson';
import { Document, FieldGeometry } from 'idai-field-core';


type extractFunc = ((geometry: Position[]) => [number[], number[]] )|
                    ((geometry: Position[][]) => [number[], number[]]);


export interface GeometryBoundings {
    minX: number;
    minY: number;
    maxX: number;
    maxY: number;
}

export const getGeometryBoundings = (documents: Document[]): GeometryBoundings | null => {

    if(!documents.length) return null;
    return getMinMaxCoords(documents.map(doc => doc.resource.geometry));
};


export const getMinMaxCoords = (geos: FieldGeometry[]): GeometryBoundings => {
    
    const xCoords: number[] = [];
    const yCoords: number[] = [];
    geos.forEach(geo => {
        switch(geo.type){
            case('Polygon'):
            case('MultiLineString'):{
                const [x, y] = extractCoordsPositions2d(geo.coordinates);
                xCoords.push(...x);
                yCoords.push(...y);
                break;}
            case('Point'):
                xCoords.push(geo.coordinates[0]);
                yCoords.push(geo.coordinates[1]);
                break;
            case('MultiPoint'):
            case('LineString'):
                {const [x, y] = extractCoordsPositions(geo.coordinates);
                xCoords.push(...x);
                yCoords.push(...y);
                break;}
                break;
            case('MultiPolygon'):
                {const [x, y] = extractCoordsPositions3d(geo.coordinates);
                xCoords.push(...x);
                yCoords.push(...y);
                break;}
            default:
                throw TypeError('No valid GeoJSON type');
        }
    });
    return {
        minX: Math.min(...xCoords), minY: Math.min(...yCoords),
        maxX: Math.max(...xCoords), maxY: Math.max(...yCoords) };

};


export const extractCoordsPositions3d = (geometries: Position[][][]): [number[], number[]] =>
    extractCoords(geometries, extractCoordsPositions2d);


export const extractCoordsPositions2d = (geometries: Position[][]): [number[], number[]] =>
    extractCoords(geometries, extractCoordsPositions);


const extractCoords = (geometries: Position[][] | Position[][][], extractFunc: extractFunc): [number[], number[]] => {

    const xCoords: number[] = [];
    const yCoords: number[] = [];
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    geometries.forEach((geo: any) => {
        xCoords.push(...extractFunc(geo)[0]);
        yCoords.push(...extractFunc(geo)[1]);
    });
    return [xCoords, yCoords];
};


export const extractCoordsPositions = (geometries: Position[]): [number[], number[]] => {
    const xCoords: number[] = [];
    const yCoords: number[] = [];
    geometries.forEach(geo => {
        xCoords.push(geo[0]);
        yCoords.push(geo[1]);
    });
    return [xCoords, yCoords];
};


/**
 * Maps value from range [oldMin,oldMax] to range [newMin,newMax]
 * @returns value between newMin and newMax
 */
// eslint-disable-next-line max-len
export const mapValueToNewRange = (newMax: number, newMin: number, value: number, oldMax: number, oldMin: number): number =>
    (newMax - newMin) * (value - oldMin) / (oldMax - oldMin) + newMin;


export const arrayDim = (a: any, dim:number = 0):number => {
    if(Array.isArray(a)) return arrayDim(a[0], dim + 1);
    else return dim;
};