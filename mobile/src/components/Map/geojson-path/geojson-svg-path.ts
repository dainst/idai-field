/**
 *
 * Functions to convert GeoJSON Geometry objects into SVG ( Scalable Vector Graphics) path elements.
 * Only supports iDAI field supported Geometry objects
 * (Polygon, Multipolygon, Linestring, Multilinestring, Point, Multipoint)
 */
import { Position } from 'geojson';
import { GeometryBoundings, mapValueToNewRange } from '../cs-transform-utils';

export const multiPolygonToPath = (
    multiPolygon: Position[][][],
    geometryBounds: GeometryBoundings,
    viewBox: [number, number, number, number]): string => {

    let path = '';
    for (const polygon of multiPolygon)
        path += polygonToPath(polygon, geometryBounds, viewBox);
    
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
export const polygonToPath = (
    polygon: Position[][],
    geometryBounds: GeometryBoundings,
    viewBox: [number, number, number, number]): string => {
   
    let path = '';
    polygon.forEach((ringCoordinates, i) => {
        path += ' ' + lineStringToPath(i === 0 ? ringCoordinates.slice().reverse() : ringCoordinates,
                            geometryBounds, viewBox);
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
export const multiLineStringToPath = (
    multiLineString: Position[][],
    geometryBounds: GeometryBoundings,
    viewBox: [number, number, number, number]): string =>
    polygonToPath(multiLineString, geometryBounds, viewBox);


export const lineStringToPath = (
    lineString: Position[],
    geometryBounds: GeometryBoundings,
    viewBox: [number, number, number, number]): string => {
    
    /* eslint-disable max-len */
    const mapX = (value: number) => mapValueToNewRange(viewBox[2], viewBox[0], value, geometryBounds.maxX, geometryBounds.minX);
    const mapY = (value: number) => mapValueToNewRange(viewBox[3], viewBox[1], value, geometryBounds.maxY, geometryBounds.minY);
    /* eslint-enable max-len */

    let path = `M${mapX(lineString[0][0])} ${mapY(lineString[0][1])}`;
    for(let i = 1; i < lineString.length; i++)
        path += ` L${mapX(lineString[i][0])} ${mapY(lineString[i][1])}`;

    return path;

};

