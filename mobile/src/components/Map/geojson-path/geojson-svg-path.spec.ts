import { LineStringToPath, PolygonToPath } from './geojson-svg-path';

describe('GeoJSON to SVG path string', () => {

    it('converts LineSting to path',() => {

        const lineString = [[1, 1], [6,1], [6 ,6], [1,6],[1,1]];
        const expectedPath = 'M1 1 L6 1 L6 6 L1 6 L1 1';
        expect(LineStringToPath(lineString)).toEqual(expectedPath);
    });

    it('converts Polygon with holes to path',() => {

        const polygon = [
                    [[1,1], [6, 1], [6, 6], [1, 6], [1, 1]],
                    [[3,2], [5,2], [3,4],[3,2]],
                    [[4,4], [5,4], [5,5], [4,5], [4,4]]];
        const expectedPath = ' M1 1 L1 6 L6 6 L6 1 L1 1 M3 2 L5 2 L3 4 L3 2 M4 4 L5 4 L5 5 L4 5 L4 4';
        expect(PolygonToPath(polygon)).toEqual(expectedPath);
    });
});