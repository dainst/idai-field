
import { Matrix4 } from 'react-native-redash';
import { matrixInverse4 } from '../geojson/matrix-utils/matrix-utils';
import { processTransform2d, setupTransformationMatrix } from './cs-transform';
import { GeometryBoundings } from './utils';
import { ViewPort } from './utils/viewport-utils';


describe('geojson-cs-to-svg',() => {

    
    it('transform GeoJSON to SVG',() => {

        const transformationMat: Matrix4 = [
            [2,0,0,4],
            [0,2,0,-2],
            [0,0,1,0],
            [0,0,0,1]];
        const position = [8,14.5];
        const expectedTransformedPos = [20, 27];
        expect(processTransform2d(transformationMat, position)).toEqual(expectedTransformedPos);
    });

  
    it('setups the correct transformation matrix', () => {

        const geoBoundings: GeometryBoundings = {
            minX: 0,
            minY: 0,
            maxX: 100,
            maxY: 100,
        };

        const viewPort: ViewPort = {
            x: 0,
            y: 0,
            width: 800,
            height: 1200,
        };

        const expectedResult: Matrix4 = [
            [12,0,0,0],
            [0,12,0,0],
            [0,0,1,0],
            [0,0,0,1]];
        
        expect(setupTransformationMatrix(geoBoundings, viewPort)).toEqual(expectedResult);
    });


    it('transforms point from test467 project worldCS to screen viewPort coords', () => {

        const geoBoundings: GeometryBoundings = {
            minX: 27.188940048217773,
            minY: 39.14105033874512,
            maxX: 27.189414739608765,
            maxY: 39.141438484191895,
        };
        const viewPort: ViewPort = { x: 0,y: 0, width: 752.941162109375,height: 1067.2940673828125 };
        const position = [27.189346313476562,39.141404151916504];
        const expectedTransformedPos = [913.4450481235981, 795.5120020061731];

        const transformationMat = setupTransformationMatrix(geoBoundings, viewPort);
        const transformedPosition = processTransform2d(transformationMat, position);
        
        transformedPosition.forEach((coord: number, i: number) => {
            expect(coord).toBeCloseTo(expectedTransformedPos[i],4);
        });
    });


    it('is possible to transform a point csWorld -> csViewPort -> csWorld', () => {
        
        const transformationMat: Matrix4 = [
            [2,0,0,4],
            [0,2,0,-2],
            [0,0,1,0],
            [0,0,0,1]];
        const position = [8,14.5];
        const transformedPosition = processTransform2d(transformationMat, position);
        const expectedTransformedPos = [20, 27];
        
        expect(transformedPosition).toEqual(expectedTransformedPos);
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        expect(processTransform2d(matrixInverse4(transformationMat)!, transformedPosition)).toEqual(position);
    });
});