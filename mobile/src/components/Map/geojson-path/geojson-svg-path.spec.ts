import { GeometryBoundings } from '../cs-transform-utils';
import { lineStringToPath, multiPolygonToPath, polygonToPath } from './geojson-svg-path';

describe('GeoJSON to SVG path string', () => {

    const polygon = [
        [[1,1], [6, 1], [6, 6], [1, 6], [1, 1]],
        [[3,2], [5,2], [3,4],[3,2]],
        [[4,4], [5,4], [5,5], [4,5], [4,4]]];
    const viewBox: [number, number, number, number] = [0, 0, 1, 1];
    const geometryBoundings:GeometryBoundings = {
        minX: 0,
        minY: 0,
        maxX: 1,
        maxY: 1
    };

    it('converts LineSting to path',() => {

        const lineString = [[1, 1], [6,1], [6 ,6], [1,6],[1,1]];
        const expectedPath = 'M1 1 L6 1 L6 6 L1 6 L1 1';
        expect(lineStringToPath(lineString, geometryBoundings, viewBox)).toEqual(expectedPath);
    });

    it('converts Polygon with holes to path',() => {
        
        const expectedPath = ' M1 1 L1 6 L6 6 L6 1 L1 1 M3 2 L5 2 L3 4 L3 2 M4 4 L5 4 L5 5 L4 5 L4 4';
        expect(polygonToPath(polygon, geometryBoundings, viewBox)).toEqual(expectedPath);
    });

    it('converts Multipolygon to path', () => {

        const multiPolygon = [
            polygon,[
            [[8,3],[11,3],[11,6],[8,6],[8,3]],
            [ [10,4],[10,5],[9,5], [10,4]]
            ]
        ];
        // eslint-disable-next-line max-len
        const expectedPath = ' M1 1 L1 6 L6 6 L6 1 L1 1 M3 2 L5 2 L3 4 L3 2 M4 4 L5 4 L5 5 L4 5 L4 4 M8 3 L8 6 L11 6 L11 3 L8 3 M10 4 L10 5 L9 5 L10 4';
        expect(multiPolygonToPath(multiPolygon, geometryBoundings, viewBox)).toEqual(expectedPath);
    });
});