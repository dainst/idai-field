import { Position } from 'geojson';
import { lineStringToPath, multiPolygonToPath, polygonToPath } from './geojson-svg-path';

describe('GeoJSON to SVG path string', () => {

    const polygon = [
        [[1,1], [6, 1], [6, 6], [1, 6], [1, 1]],
        [[3,2], [5,2], [3,4],[3,2]],
        [[4,4], [5,4], [5,5], [4,5], [4,4]]];
    
    const csTransformFunction = (pos: Position): Position => pos;

    it('converts LineSting to path',() => {

        const lineString = [[1, 1], [6,1], [6 ,6], [1,6],[1,1]];
        const expectedPath = 'M1 1 L6 1 L6 6 L1 6 L1 1';
        expect(lineStringToPath(lineString, csTransformFunction)).toEqual(expectedPath);
    });

    it('converts and maps LineString correctly', () => {

        const transformFunc = (pos: Position) => [pos[0] * 2, pos[1] * 2];
        const lineString = [[1, 1], [6,1], [6 ,6], [1,6],[1,1]];
        const expectedPath = 'M2 2 L12 2 L12 12 L2 12 L2 2';
        expect(lineStringToPath(lineString, transformFunc)).toEqual(expectedPath);
    });

    it('converts Polygon with holes to path',() => {
        
        const expectedPath = ' M1 1 L1 6 L6 6 L6 1 L1 1 M3 2 L5 2 L3 4 L3 2 M4 4 L5 4 L5 5 L4 5 L4 4';
        expect(polygonToPath(polygon, csTransformFunction)).toEqual(expectedPath);
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
        expect(multiPolygonToPath(multiPolygon, csTransformFunction)).toEqual(expectedPath);
    });
});