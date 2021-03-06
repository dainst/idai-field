import { lineStringToPath, multiPolygonToPath, polygonToPath } from './geojson-svg-path';

describe('GeoJSON to SVG path string', () => {

    const polygon = [
        [[1,1], [6, 1], [6, 6], [1, 6], [1, 1]],
        [[3,2], [5,2], [3,4],[3,2]],
        [[4,4], [5,4], [5,5], [4,5], [4,4]]];
    

    it('converts LineSting to path',() => {

        const lineString = [[1, 1], [6,1], [6 ,6], [1,6],[1,1]];
        const expectedPath = 'M1 1 L6 1 L6 6 L1 6 L1 1';
        expect(lineStringToPath(lineString)).toEqual(expectedPath);
    });


    it('converts Polygon with holes to path',() => {
        
        const expectedPath = ' M1 1 L1 6 L6 6 L6 1 L1 1 M3 2 L5 2 L3 4 L3 2 M4 4 L5 4 L5 5 L4 5 L4 4 Z';
        expect(polygonToPath(polygon)).toEqual(expectedPath);
    });

    it('converts Multipolygon to path', () => {

        const multiPolygon = [
            polygon,[
            [[8,3],[11,3],[11,6],[8,6],[8,3]],
            [ [10,4],[10,5],[9,5], [10,4]]
            ]
        ];
        // eslint-disable-next-line max-len
        const expectedPath = ' M1 1 L1 6 L6 6 L6 1 L1 1 M3 2 L5 2 L3 4 L3 2 M4 4 L5 4 L5 5 L4 5 L4 4 Z M8 3 L8 6 L11 6 L11 3 L8 3 M10 4 L10 5 L9 5 L10 4 Z';
        expect(multiPolygonToPath(multiPolygon)).toEqual(expectedPath);
    });

    
    it('converts floating point values with decimal places',() => {
        
        const polygon = [
            [[27.18925452232361, 39.14129686355591 ],
            [27.189281702041626, 39.14129686355591],
            [27.189281702041626, 39.14131808280945],
            [27.18925452232361, 39.14131808280945]]];
            
        // eslint-disable-next-line max-len
        const expectedPath = ' M27.18925452232361 39.14131808280945 L27.189281702041626 39.14131808280945 L27.189281702041626 39.14129686355591 L27.18925452232361 39.14129686355591 Z';
        expect(polygonToPath(polygon)).toEqual(expectedPath);
    });
});