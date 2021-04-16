import { Position } from 'geojson';
import { Document, FieldGeometry } from 'idai-field-core';


type extractFunc = ((geometry: Position[]) => [number[], number[]] )|
                    ((geometry: Position[][]) => [number[], number[]]);

export const defineViewBox = (documents: Document[]): string => {

    const [minX, minY, maxX, maxY] = getMinMaxCoords(documents.map(doc => doc.resource.geometry));
    return `${minX} ${minY} ${maxX - minX} ${maxY - minY}`;
};

export const getMinMaxCoords = (geos: FieldGeometry[]): [number, number, number, number] => {
    
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
    return [
        Math.min(...xCoords), Math.min(...yCoords),
        Math.max(...xCoords), Math.max(...yCoords)];

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