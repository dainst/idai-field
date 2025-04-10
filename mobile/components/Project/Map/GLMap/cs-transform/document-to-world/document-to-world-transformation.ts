import { identityMatrix4, Matrix4 } from 'react-native-redash';
import { defineWorldCoordinateSystem } from '../constants';
import { CSBox, GeometryBoundings } from '../types';
import { getDocumentToWorldTransform } from './doc2world-trans-matrix';


// eslint-disable-next-line max-len
export const getDocumentToWorldTransformMatrix = (geoBoundings: GeometryBoundings | null): Matrix4 => {

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


