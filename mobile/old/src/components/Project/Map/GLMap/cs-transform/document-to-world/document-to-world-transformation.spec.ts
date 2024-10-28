import { Matrix4 } from 'react-native-redash';
import { matrixInverse4, processTransform2d } from '../matrix-utils/matrix-utils';
import { GeometryBoundings } from '../types';
import { getDocumentToWorldTransformMatrix } from './document-to-world-transformation';


describe('cs-transforms',() => {

    
    it('transform GeoJSON to World',() => {

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


        const expectedResult: Matrix4 = [
            [10,0,0,0],
            [0,10,0,0],
            [0,0,1,0],
            [0,0,0,1]];
        
        expect(getDocumentToWorldTransformMatrix(geoBoundings)).toEqual(expectedResult);
    });


    it('transforms point from test467 project documentCS to worldCS coords', () => {

        const geoBoundings: GeometryBoundings = {
            minX: 27.188940048217773,
            minY: 39.14105033874512,
            maxX: 27.189414739608765,
            maxY: 39.141438484191895,
        };
        
        const position = [27.189346313476562,39.141404151916504];
        const expectedTransformedPos = [855.85133, 745.354093];

        const transformationMat = getDocumentToWorldTransformMatrix(geoBoundings);
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