import { CSBox } from './types';

export const WORLD_CS_WIDTH = 1000;
export const WORLD_CS_HEIGHT = 1000;

export const defineWorldCoordinateSystem = (): CSBox => (
    // defines boundaries of world coordinate system. WorldCS is right-handed coordinate system
     {
        minX: 0,
        width: WORLD_CS_WIDTH,
        minY: 0,
        height: WORLD_CS_HEIGHT,
    }
);