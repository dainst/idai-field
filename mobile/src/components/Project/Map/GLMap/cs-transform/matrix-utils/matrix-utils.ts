import { Position } from 'geojson';
import { Matrix4, matrixVecMul4 } from 'react-native-redash';


export const matrixInverse4 = (m: Matrix4 ): Matrix4 | null => {

    const det00 = m[0][0] * m[1][1] - m[0][1] * m[1][0];
    const det02 = m[0][0] * m[1][3] - m[0][3] * m[1][0];
    const det03 = m[0][1] * m[1][2] - m[0][2] * m[1][1];
    const det01 = m[0][0] * m[1][2] - m[0][2] * m[1][0];
    const det04 = m[0][1] * m[1][3] - m[0][3] * m[1][1];
    const det05 = m[0][2] * m[1][3] - m[0][3] * m[1][2];
    const det06 = m[2][0] * m[3][1] - m[2][1] * m[3][0];
    const det07 = m[2][0] * m[3][2] - m[2][2] * m[3][0];
    const det08 = m[2][0] * m[3][3] - m[2][3] * m[3][0];
    const det09 = m[2][1] * m[3][2] - m[2][2] * m[3][1];
    const det10 = m[2][1] * m[3][3] - m[2][3] * m[3][1];
    const det11 = m[2][2] * m[3][3] - m[2][3] * m[3][2];

    let det = (det00 * det11 - det01 * det10 + det02 * det09 + det03 * det08 - det04 * det07 + det05 * det06);

    if (!det) {
        return null;
    }

    det = 1.0 / det;


    return [
        [
            (m[1][1] * det11 - m[1][2] * det10 + m[1][3] * det09) * det,
            (-m[0][1] * det11 + m[0][2] * det10 - m[0][3] * det09) * det,
            (m[3][1] * det05 - m[3][2] * det04 + m[3][3] * det03) * det,
            (-m[2][1] * det05 + m[2][2] * det04 - m[2][3] * det03) * det
        ],
        [
            (-m[1][0] * det11 + m[1][2] * det08 - m[1][3] * det07) * det,
            (m[0][0] * det11 - m[0][2] * det08 + m[0][3] * det07) * det,
            (-m[3][0] * det05 + m[3][2] * det02 - m[3][3] * det01) * det,
            (m[2][0] * det05 - m[2][2] * det02 + m[2][3] * det01) * det
        ],
        [
            (m[1][0] * det10 - m[1][1] * det08 + m[1][3] * det06) * det,
            (-m[0][0] * det10 + m[0][1] * det08 - m[0][3] * det06) * det,
            (m[3][0] * det04 - m[3][1] * det02 + m[3][3] * det00) * det,
            (-m[2][0] * det04 + m[2][1] * det02 - m[2][3] * det00) * det
        ],
        [
            (-m[1][0] * det09 + m[1][1] * det07 - m[1][2] * det06) * det,
            (m[0][0] * det09 - m[0][1] * det07 + m[0][2] * det06) * det,
            (-m[3][0] * det03 + m[3][1] * det01 - m[3][2] * det00) * det,
            (m[2][0] * det03 - m[2][1] * det01 + m[2][2] * det00) * det,
        ]

    
] as const;

};


export const processTransform2d = (transformationMatrix: Matrix4, position: Position): Position => {
    const outVec = matrixVecMul4(transformationMatrix, [position[0], position[1], 0, 1]);
    return [outVec[0], outVec[1]];
};