import { Position } from 'geojson';
import { viewBox } from '../../constants';
import { GeometryBoundings, mapValueToNewRange } from '../../cs-transform-utils';

export const transformGeojsonToSvg = (geoBoundings: GeometryBoundings, position: Position): Position => {

    const [viewStartX, viewStartY, viewWidth, _viewHeigt] = viewBox;
    const { minX, minY, maxX, maxY } = geoBoundings;
    const height = (maxY - minY) / (maxX - minX) * viewWidth; //keep aspect ratio

    const mappedX = mapValueToNewRange(viewWidth,viewStartX,position[0], maxX, minX);
    const mappedY = mapValueToNewRange(height,viewStartY,position[1], maxY, minY);
    return [mappedX, mappedY];
};