import { Matrix4 } from 'react-native-redash';
import { matrixInverse4 } from './matrix-utils';

describe('matrix utils', () => {

    it('can compute the matrix inverse of a 4x4 matrix',() => {

        const m: Matrix4 = [
            [-4, -3, 3, 2],
            [0, 2, -1, 5],
            [0, 0, 1, 1],
            [0, 0, 0, 1]];
        const expectedInverseM: Matrix4 = [
            [-0.25, -0.375, 0.375, 2],
            [0, 0.5, 0.5, -3],
            [-0, -0, 1, -1],
            [-0, -0, -0, 1]];

        expect(matrixInverse4(m)).toEqual(expectedInverseM);
    });

    it('returns null for non invertable matrix', () => {

        const m: Matrix4 = [
            [1, 0, 0, 0],
            [0, 1, 0, 0],
            [0, 0, 0, 0],
            [0, 0, 0, 1]];

        expect(matrixInverse4(m)).toBe(null);
    });
});