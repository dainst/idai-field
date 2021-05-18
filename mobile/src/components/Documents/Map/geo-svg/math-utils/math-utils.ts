import { Position } from 'geojson';
import { pointRadius } from '../constants';

/**
 * polygonArea
 * Exterior ring coordinates need to be converted to 'cut' holes in polygon
 * with inner ring coordinates (https://developer.mozilla.org/en-US/docs/Web/SVG/Attribute/fill-rule).
 * Therefore, outer ring coordinates are the area of the polygon. The inner ring coords represent holes and
 * have therefore be subtracted from the area formed by the outer ring coords
 * @param polygon GeoJSON polygon
 * @returns area of the polygon
 */
export const polygonArea = (polygon: Position[][]): number => {
    
    const outerArea = ringCoordinatesArea(polygon[0]);
    let innerAreas = 0;
    for(let i = 1; i < polygon.length; i++){
        innerAreas += ringCoordinatesArea(polygon[i]);
    }
    return outerArea - innerAreas;
};


const ringCoordinatesArea = (lineString: Position[]) => {
    
    let sum = 0;
    const lineStringLength = lineString.length;
    for(let i = 0; i < lineStringLength; i++){
        const [x_i, y_i] = lineString[i];
        const [x_i1, y_i1] = lineString[(i + 1) % lineStringLength];
        sum += x_i * y_i1 - x_i1 * y_i;
    }
    return Math.abs(sum) / 2;
};


export const pointArea = (): number => Math.PI * Math.pow(pointRadius,2);


export const lineArea = (): 0 => 0;