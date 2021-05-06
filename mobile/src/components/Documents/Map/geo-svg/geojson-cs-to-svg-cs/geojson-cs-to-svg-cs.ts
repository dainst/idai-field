import { Position } from 'geojson';
import { identityMatrix4, Matrix4, matrixVecMul4, multiply4, processTransform3d } from 'react-native-redash';
import { GeometryBoundings } from './cs-transform-utils';
import { getViewPortTransform, ViewBox, ViewPort } from './viewport-utils/viewport-utils';


export const processTransform2d = (transformationMatrix: Matrix4, position: Position): Position => {
    const outVec = matrixVecMul4(transformationMatrix, [position[0], position[1], 0, 1]);
    return [outVec[0], outVec[1]];
};


// eslint-disable-next-line max-len
export const setupTransformationMatrix = (geoBoundings: GeometryBoundings | null, viewPort: ViewPort | undefined): Matrix4 => {

    if(!geoBoundings || !viewPort) return identityMatrix4;
    const { minX, minY, maxX, maxY } = geoBoundings;

    const viewPortHeight = adjustViewPortHeightToKeepAspectRatio(
        viewPort.width,
        { height: maxY - minY , width: maxX - minX });
    const viewBox: ViewBox = [minX, minY, maxX - minX, maxY - minY];
    
    const { scaleX, scaleY,
        translateX, translateY } = getViewPortTransform(viewBox,{ ...viewPort, height: viewPortHeight });
    const worldToViewPort: Matrix4 = [
        [scaleX, 0, 0, translateX],
        [0, scaleY, 0, translateY],
        [0, 0, 1, 0],
        [0,0,0,1]
    ];

    return multiply4(correctYCoordinateDirection(viewPortHeight), worldToViewPort);
};


const adjustViewPortHeightToKeepAspectRatio = (viewPortWidth: number, worldCsRange: {width: number, height: number}) =>
    worldCsRange.height / worldCsRange.width * viewPortWidth;


/**
 * Transforms y GeoJson coordinate to correct different orientation between SVG y-axis and GeoJSON y-axis
 * ^
 * |y       ---
 * |    to  |
 * ---      |y
 * Geo      Svg
 * @param yCoord
 * @param viewBoxHeight
 * @returns correctly transformed y coordinate
 */
const correctYCoordinateDirection = (height: number): Matrix4 =>
    processTransform3d([{ translateY: height }, { scaleY: -1 }]);