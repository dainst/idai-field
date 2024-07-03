import { describe, expect, test } from '@jest/globals';
import { CoordinatesUtility } from '../../../../../src/app/components/resources/map/map/coordinates-utility';


/**
 * @author Thomas Kleinke
 */
describe('CoordinatesUtility', () => {

    test('convert polygon coordinates from lngLat to latLng', () => {

        const coordinates = [[[-7.0, -5.0], [-6.0, -5.0], [7.0, -7.0], [9.0, 1.0], [7.0, 7.0], [5.0, 10.0],
            [-7.0, 7.0]]];
        const expectedResult = [[[-5.0, -7.0], [-5.0, -6.0], [-7.0, 7.0], [1.0, 9.0], [7.0, 7.0], [10.0, 5.0],
            [7.0, -7.0]]];
        const result = CoordinatesUtility.convertPolygonCoordinatesFromLngLatToLatLng(coordinates);

        expect(result).toEqual(expectedResult);
    });


    test('convert polyline coordinates from lngLat to latLng', () => {

        const coordinates = [[1.0, 3.0], [1.5, 2.5], [1.75, 2.5], [1.9, 2.25], [1.35, 2.0], [1.0, 1.0]];
        const expectedResult = [[3.0, 1.0], [2.5, 1.5], [2.5, 1.75], [2.25, 1.9], [2.0, 1.35], [1.0, 1.0]];
        const result = CoordinatesUtility.convertPolylineCoordinatesFromLngLatToLatLng(coordinates);

        expect(result).toEqual(expectedResult);
    });
});
