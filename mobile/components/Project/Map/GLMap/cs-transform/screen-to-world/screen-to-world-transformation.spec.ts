import { identity4 } from 'react-native-redash';
import { getScreenToWorldTransformationMatrix } from './screen-to-world-transformation';

describe('screen-to-world transformation', () => {
  it('returns a finite fallback matrix while the map has no measured size', () => {
    expect(getScreenToWorldTransformationMatrix({
      height: 0,
      width: 0,
      x: 0,
      y: 0,
    })).toEqual(identity4);
  });

  it('returns a finite matrix for a measured tablet screen', () => {
    const matrix = getScreenToWorldTransformationMatrix({
      height: 1340,
      width: 800,
      x: 0,
      y: 0,
    });

    expect(matrix.every(Number.isFinite)).toBe(true);
  });
});
