import { equal, isArray } from 'tsfun';


export type FieldGeometryType = 'Polygon' | 'MultiPolygon' | 'LineString' | 'MultiLineString' | 'Point' | 'MultiPoint';


export interface FieldGeometry {

    type: FieldGeometryType;
    coordinates: Array<any>;
}


/**
 * @author Thomas Kleinke
 */
export module FieldGeometry {

    export function closeRings(geometry: FieldGeometry) {

        if (geometry.type === 'MultiPolygon') {
            closeMultiPolygonRings(geometry.coordinates);
        } else if (geometry.type === 'Polygon') {
            closePolygonRings(geometry.coordinates);
        }
    }


    function closeMultiPolygonRings(coordinates: number[][][][]) {

        if (!isArray(coordinates)) return;

        coordinates.forEach(polygonCoordinates => closePolygonRings(polygonCoordinates));
    }


    function closePolygonRings(coordinates: number[][][]) {
        
        if (!isArray(coordinates)) return;

        for (let pathCoordinates of coordinates) {
            if (!isArray(pathCoordinates) || pathCoordinates.length < 3) continue;
            const firstCoordinate: number[] = pathCoordinates[0];
            const lastCoordinate: number[] = pathCoordinates[pathCoordinates.length - 1];
            if (!isArray(firstCoordinate) || firstCoordinate.length < 2
                    || !isArray(lastCoordinate) || lastCoordinate.length < 2) {
                continue;
            }
            if (!equal(firstCoordinate)(lastCoordinate)) {
                pathCoordinates.push(firstCoordinate.slice());
            }
        }
    }
}
