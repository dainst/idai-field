import { Position } from 'geojson';
import { Matrix4, matrixVecMul4 } from 'react-native-redash';


export const matrixInverse4 = (m: Matrix4 ): Matrix4 | null => {

    const valueAt = (row: number, column: number): number => m[row * 4 + column];

    const det00 = valueAt(0, 0) * valueAt(1, 1) - valueAt(0, 1) * valueAt(1, 0);
    const det02 = valueAt(0, 0) * valueAt(1, 3) - valueAt(0, 3) * valueAt(1, 0);
    const det03 = valueAt(0, 1) * valueAt(1, 2) - valueAt(0, 2) * valueAt(1, 1);
    const det01 = valueAt(0, 0) * valueAt(1, 2) - valueAt(0, 2) * valueAt(1, 0);
    const det04 = valueAt(0, 1) * valueAt(1, 3) - valueAt(0, 3) * valueAt(1, 1);
    const det05 = valueAt(0, 2) * valueAt(1, 3) - valueAt(0, 3) * valueAt(1, 2);
    const det06 = valueAt(2, 0) * valueAt(3, 1) - valueAt(2, 1) * valueAt(3, 0);
    const det07 = valueAt(2, 0) * valueAt(3, 2) - valueAt(2, 2) * valueAt(3, 0);
    const det08 = valueAt(2, 0) * valueAt(3, 3) - valueAt(2, 3) * valueAt(3, 0);
    const det09 = valueAt(2, 1) * valueAt(3, 2) - valueAt(2, 2) * valueAt(3, 1);
    const det10 = valueAt(2, 1) * valueAt(3, 3) - valueAt(2, 3) * valueAt(3, 1);
    const det11 = valueAt(2, 2) * valueAt(3, 3) - valueAt(2, 3) * valueAt(3, 2);

    let det = (det00 * det11 - det01 * det10 + det02 * det09 + det03 * det08 - det04 * det07 + det05 * det06);

    if (!det) {
        return null;
    }

    det = 1.0 / det;


    return [
        (valueAt(1, 1) * det11 - valueAt(1, 2) * det10 + valueAt(1, 3) * det09) * det,
        (-valueAt(0, 1) * det11 + valueAt(0, 2) * det10 - valueAt(0, 3) * det09) * det,
        (valueAt(3, 1) * det05 - valueAt(3, 2) * det04 + valueAt(3, 3) * det03) * det,
        (-valueAt(2, 1) * det05 + valueAt(2, 2) * det04 - valueAt(2, 3) * det03) * det,
        (-valueAt(1, 0) * det11 + valueAt(1, 2) * det08 - valueAt(1, 3) * det07) * det,
        (valueAt(0, 0) * det11 - valueAt(0, 2) * det08 + valueAt(0, 3) * det07) * det,
        (-valueAt(3, 0) * det05 + valueAt(3, 2) * det02 - valueAt(3, 3) * det01) * det,
        (valueAt(2, 0) * det05 - valueAt(2, 2) * det02 + valueAt(2, 3) * det01) * det,
        (valueAt(1, 0) * det10 - valueAt(1, 1) * det08 + valueAt(1, 3) * det06) * det,
        (-valueAt(0, 0) * det10 + valueAt(0, 1) * det08 - valueAt(0, 3) * det06) * det,
        (valueAt(3, 0) * det04 - valueAt(3, 1) * det02 + valueAt(3, 3) * det00) * det,
        (-valueAt(2, 0) * det04 + valueAt(2, 1) * det02 - valueAt(2, 3) * det00) * det,
        (-valueAt(1, 0) * det09 + valueAt(1, 1) * det07 - valueAt(1, 2) * det06) * det,
        (valueAt(0, 0) * det09 - valueAt(0, 1) * det07 + valueAt(0, 2) * det06) * det,
        (-valueAt(3, 0) * det03 + valueAt(3, 1) * det01 - valueAt(3, 2) * det00) * det,
        (valueAt(2, 0) * det03 - valueAt(2, 1) * det01 + valueAt(2, 2) * det00) * det,
    ];

};


export const processTransform2d = (transformationMatrix: Matrix4, position: Position): Position => {
    const outVec = matrixVecMul4(transformationMatrix, [position[0], position[1], 0, 1]);
    return [outVec[0], outVec[1]];
};
