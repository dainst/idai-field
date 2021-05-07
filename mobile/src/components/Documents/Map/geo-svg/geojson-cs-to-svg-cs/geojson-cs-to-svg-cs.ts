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
    const viewBox: ViewBox = [minX, minY, maxX - minX, maxY - minY];

    const { aspect_vb, aspect_vp } = adjustViewPortAndBoxToKeepAspectRatio(viewPort, viewBox);
    const { scaleX, scaleY, translateX, translateY } = getViewPortTransform( aspect_vb, aspect_vp);
    const worldToViewPort: Matrix4 = [
        [scaleX, 0, 0, translateX],
        [0, scaleY, 0, translateY],
        [0, 0, 1, 0],
        [0,0,0,1]
    ];

    return multiply4(correctYCoordinateDirection(Math.max(viewPort.width, viewPort.height)), worldToViewPort);
};


export const adjustViewPortAndBoxToKeepAspectRatio = (viewPort: ViewPort, viewBox: ViewBox):
    //see https://www.albany.edu/faculty/jmower/geog/gog530Python/src/NormalizingCoordinatesManual.html
    {aspect_vp: ViewPort, aspect_vb: ViewBox} => {

    const viewPortDim = Math.max(viewPort.width, viewPort.height);
    const viewBoxDim = Math.max(viewBox[2], viewBox[3]);
    return {
        aspect_vp: { ...viewPort, width: viewPortDim, height: viewPortDim },
        aspect_vb: [viewBox[0], viewBox[1], viewBoxDim, viewBoxDim]
    };
};


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