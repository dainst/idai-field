import { pointRadius } from '../constants';
import { pointArea, polygonArea } from './math-utils';

describe('geo-svg/math-utils', () => {

    it('should calculate the point area correctly', () => {
        
        expect(pointArea()).toBe(Math.PI * Math.pow(pointRadius,2));
    });

    
    it('should calculate the area of a polygon regarding https://en.wikipedia.org/wiki/Polygon#Area', () => {

        const polygon = [
            [[2,11],[17,13],[11,2],[2,2]]
        ];
        expect(polygonArea(polygon)).toBe(117);
    });


    it('should calculate the area of a polygon with holes', () => {
        const polygon = [
            [[2,2],[2,5],[5,9],[8,7],[9,4],[5,2]],//32.5
            [[4,2],[4,5],[5,6],[6,5],[5,4],[6,3]]//5
        ];
        expect(polygonArea(polygon)).toBe(32.5 - 5);
    });
});