
import { GeometryBoundings } from '../../cs-transform-utils';
import { transformGeojsonToSvg } from './geojson-cs-to-svg-cs';

const geoBoundings: GeometryBoundings = {
    minX: 5,
    maxX: 55,
    minY: 10,
    maxY: 50,
};

describe('geojson-cs-to-svg',() => {

    it('transform GeoJSON to SVG',() => {
        
        const position = [8,14.5];
        const expectedTransformedPos = [6, 71];
        expect(transformGeojsonToSvg(geoBoundings, position)).toEqual(expectedTransformedPos);
    });
});