import { LayoutRectangle } from 'react-native';
import { identity4, Matrix4, processTransform3d } from 'react-native-redash';
import { defineWorldCoordinateSystem } from '../constants';
/**
 * Transforms screen coordinate system to world cs
 * and takes care of the different y axis directions of the coordinate systems
 * ^
 * |y       ---
 * |    to  |
 * ---      |y
 * world     screen
 * @screen Screen rectangle
 * @returns transformation matrix from screen to world
 */
export const getScreenToWorldTransformationMatrix = (screen: LayoutRectangle): Matrix4 => {
    if (!isUsableScreenDimension(screen.width) || !isUsableScreenDimension(screen.height)) {
        return identity4;
    }

    const worldCS = defineWorldCoordinateSystem();
    const scaleX = worldCS.width / screen.width;
    const scaleY = worldCS.height / screen.height;

    return processTransform3d([{ translateY: worldCS.height }, { scaleY: -1 * scaleY }, { scaleX }]);
};

const isUsableScreenDimension = (value: number): boolean =>
    Number.isFinite(value) && value > 0;
