import { Position } from 'geojson';
import { viewBox } from '../../constants';
import { GeometryBoundings, mapValueToNewRange } from '../../cs-transform-utils';

export const transformGeojsonToSvg = (geoBoundings: GeometryBoundings, position: Position): Position => {

    const [viewStartX, viewStartY, viewWidth, _viewHeigt] = viewBox;
    const { minX, minY, maxX, maxY } = geoBoundings;
    const height = (maxY - minY) / (maxX - minX) * viewWidth; //keep aspect ratio

    let mappedX = mapValueToNewRange(viewWidth,viewStartX,position[0], maxX, minX);
    let mappedY = mapValueToNewRange(height,viewStartY,position[1], maxY, minY);
    mappedY = correctYCoordinateDirection(mappedY, height);

    //handle edge cases
    if(isNaN(mappedX) || !isFinite(mappedX)) mappedX = 50;
    if(isNaN(mappedY) || !isFinite(mappedY)) mappedY = 50;

    return [mappedX, mappedY];
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
const correctYCoordinateDirection = (yCoord: number, viewBoxHeight: number) => viewBoxHeight - yCoord;