
import { extractCoordsPositions, extractCoordsPositions2d, extractCoordsPositions3d } from './view-box-utils';

describe('view-box-utils functions', () => {

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
    
});