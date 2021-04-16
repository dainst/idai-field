/**
 *
 * Functions to convert GeoJSON Geometry objects into SVG ( Scalable Vector Graphics) path elements.
 * Only supports iDAI field supported Geometry objects
 * (Polygon, Multipolygon, Linestring, Multilinestring, Point, Multipoint)
 */
import { Position } from 'geojson';

export const multiPolygonToPath = (multiPolygon: Position[][][]): string => {

    let path = '';
    for (const polygon of multiPolygon)
        path += polygonToPath(polygon);
    
    return path;
};


/**
 * PolygonToPath
 * Convert GEOJSON Polygon to path string <Path d=PolygonToPath(pol) />
 * Exterior ring coordinates need to be converted to 'cut' holes in polygon
 * with inner ring coordinates (https://developer.mozilla.org/en-US/docs/Web/SVG/Attribute/fill-rule)
 * @param polygon Polygon coordinates
 * @returns string to be used with SVG path element
 */
export const polygonToPath = (polygon: Position[][]): string => {
   
    let path = '';
    polygon.forEach((ringCoordinates, i) => {
        path += ' ' + lineStringToPath(i === 0 ? ringCoordinates.slice().reverse() : ringCoordinates);
    });

    return path;
};


/**
 * multiLineStringToPath
 * Regarding GeoJSON standards MultiLineString can be converted
 * to path just like the polygon
 * @param multiLineString MutliLineString coordinates
 * @returns string to be used with SVG path element
 */
export const multiLineStringToPath = (multiLineString: Position[][]): string => polygonToPath(multiLineString);


export const lineStringToPath = (lineString: Position[]): string => {

    let path = `M${lineString[0][0]} ${lineString[0][1]}`;
    for(let i = 1; i < lineString.length; i++)
        path += ` L${lineString[i][0]} ${lineString[i][1]}`;

    return path;

};

