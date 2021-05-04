
import { GeometryBoundings } from '../../cs-transform-utils';
import { transformGeojsonToSvg } from './geojson-cs-to-svg-cs';


describe('geojson-cs-to-svg',() => {

    it('transform GeoJSON to SVG',() => {

        const geoBoundings: GeometryBoundings = {
            minX: 5,
            maxX: 55,
            minY: 10,
            maxY: 50,
        };
        const position = [8,14.5];
        const expectedTransformedPos = [6, 71];
        expect(transformGeojsonToSvg(geoBoundings, position)).toEqual(expectedTransformedPos);
    });

    it('handles case if geometry boundings are minX === minY and minY === maxY',() => {
        const geoBoundings: GeometryBoundings = {
            minX: 5,
            maxX: 5,
            minY: 5,
            maxY: 5,
        };
        const position = [23.5,90.5];
        const expectedTransformedPos = [50, 50];
        expect(transformGeojsonToSvg(geoBoundings, position)).toEqual(expectedTransformedPos);
    });
});