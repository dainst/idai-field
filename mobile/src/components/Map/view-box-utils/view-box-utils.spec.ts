
import { bu1 } from '../../../../test_data/test_docs/bu1';
import { lineBuilding } from '../../../../test_data/test_docs/lineBuilding';
import { multiPointSurvey } from '../../../../test_data/test_docs/multiPointSurvey';
import { multiPolyTrench } from '../../../../test_data/test_docs/multiPolyTrench';
import { pointBuilding } from '../../../../test_data/test_docs/pointBuilding';
//import { multiPointSurvey } from "../../../../test_data/test_docs/multiPointSurvey";
import {
    defineViewBox,
    extractCoordsPositions,
    extractCoordsPositions2d,
    extractCoordsPositions3d,
    getMinMaxCoords
} from './view-box-utils';

const positionArray = [[1,4], [3,5], [6,9], [0,5.5]];
const expectedArray = [
    [1, 3, 6, 0],
    [4, 5, 9, 5.5]];

const positionArray2d = [
    positionArray,
    [[1,1], [7,8], [0.34, 0.6], [4,90]],
    [[9,1], [300,546]]
];
const expectedArray2d = [
    [...expectedArray[0], 1, 7, 0.34, 4, 9, 300],
    [...expectedArray[1], 1, 8, 0.6, 90, 1, 546]
];
const expectedXmax = 27.189346313476562;
const expectedXmin = 27.189085960388184;
const expectedYmax = 39.141438484191895;
const expectedYmin = 39.14105033874512;

describe('view-box-utils functions', () => {


    it('returns array of x coordinate and array of y coords for Position[]', () => {
   
        expect(extractCoordsPositions(positionArray)).toEqual(expectedArray);
    });


    it('returns array of x coordinate and array of y coords for Position[][]', () => {
  
        expect(extractCoordsPositions2d(positionArray2d)).toEqual(expectedArray2d);
    });


    it('returns array of x coordinate and array of y coords for Position[][][]', () => {

        const positionArray3d = [
            positionArray2d,[
            [[1,1], [10,39],[93,23]],
            [[6,7],[234,254], [67,89], [9,94.56]]
            ]
        ];
        const expectedArray3d = [
            [...expectedArray2d[0], 1, 10, 93, 6, 234, 67, 9],
            [...expectedArray2d[1], 1, 39, 23, 7, 254, 89, 94.56]
        ];
        expect(extractCoordsPositions3d(positionArray3d)).toEqual(expectedArray3d);
    });


    it('gets min and max x and y coordinates of FieldGeometry[]', () => {

        const [xMin, yMin, xMax, yMax] = getMinMaxCoords([
            bu1.resource.geometry, lineBuilding.resource.geometry, multiPointSurvey.resource.geometry,
            multiPolyTrench.resource.geometry, pointBuilding.resource.geometry
        ]);


        expect(xMin).toBe(expectedXmin);
        expect(xMax).toBe(expectedXmax);
        expect(yMin).toBe(expectedYmin);
        expect(yMax).toBe(expectedYmax);
    });


    it('defines the viewBox of a SVG', () => {

        // eslint-disable-next-line max-len
        const expectedViewBox = `${expectedXmin} ${expectedYmin} ${expectedXmax - expectedXmin} ${expectedYmax - expectedYmin}`;
        const calculatedViewBox = defineViewBox([bu1, pointBuilding, lineBuilding, multiPointSurvey, multiPolyTrench]);
        
        expect(calculatedViewBox).toEqual(expectedViewBox);
    });
    
});