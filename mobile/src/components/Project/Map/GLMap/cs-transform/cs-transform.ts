import { Position } from 'geojson';
import { identityMatrix4, Matrix4, matrixVecMul4 } from 'react-native-redash';
import { CSBox } from './types';
import { GeometryBoundings } from './utils';
import { getDocumentToWorldTransform } from './utils/document-to-world-transformation';


export const processTransform2d = (transformationMatrix: Matrix4, position: Position): Position => {
    const outVec = matrixVecMul4(transformationMatrix, [position[0], position[1], 0, 1]);
    return [outVec[0], outVec[1]];
};


// eslint-disable-next-line max-len
export const setupDocumentToWorldTransformMatrix = (geoBoundings: GeometryBoundings | null): Matrix4 => {

    if(!geoBoundings) return identityMatrix4;

    const worldCS = defineWorldCoordinateSystem();
    const documentCS = adjustAspectRatio(geoBoundings);
    const { scaleX, scaleY, translateX, translateY } = getDocumentToWorldTransform( documentCS, worldCS);
    const worldToViewPort: Matrix4 = [
        [scaleX, 0, 0, translateX],
        [0, scaleY, 0, translateY],
        [0, 0, 1, 0],
        [0,0,0,1]
    ];
    return worldToViewPort;
};


export const adjustAspectRatio = (geoBoundings: GeometryBoundings): CSBox => {
    //see https://www.albany.edu/faculty/jmower/geog/gog530Python/src/NormalizingCoordinatesManual.html
    
    const { minX, minY, maxX, maxY } = geoBoundings;
    const maxWidthHeight = Math.max(maxX - minX, maxY - minY);
    return {
        minX,
        minY,
        width: maxWidthHeight,
        height: maxWidthHeight,
    };
};


export const defineWorldCoordinateSystem = (): CSBox => (
    // defines boundaries of world coordinate system. WorldCS is right-handed coordinate system
     {
        minX: 0,
        width: 1000,
        minY: 0,
        height: 1000,
    }
);


