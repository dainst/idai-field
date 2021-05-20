import { Position } from 'geojson';
import { TransformedDocument } from '..';
import { bu1 } from '../../../../../../test_data/test_docs/bu1';
import { lineBuilding } from '../../../../../../test_data/test_docs/lineBuilding';
import { multiPolyTrench } from '../../../../../../test_data/test_docs/multiPolyTrench';
import { pointBuilding } from '../../../../../../test_data/test_docs/pointBuilding';
import { pointRadius } from '../constants';
import {
    isLineStringInPolygon,
    isPointInMultiPolygon, isPointInPolygon, isPointInRingCoordinates,
    isPolygonInMultiPolygon,
    isPolygonInPolygon, pointArea, polygonArea,
    sortDocumentByGeometryArea
} from './math-utils';

const polygonWithHole = [
    [[2,2],[2,5],[5,9],[8,7],[9,4],[5,2]],//area 32.5
    [[4,2],[4,5],[5,6],[6,5],[5,4],[6,3]]//area 5
];

const multiPolygon: Position[][][] = [
    polygonWithHole,
    [
        [[11,10], [15,12], [15,8], [14,9] ,[13,8]]
    ]
];

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
        
        expect(polygonArea(polygonWithHole)).toBe(32.5 - 5);
    });


    it('should sort Document by FieldGeometry area', () => {

        const docs = [tBu1, tLineBuilding, tMultiPolyTrench, tPointBuilding];
        const expectedOrder = ['multiTrench', 'B1', 'pointBuilding', 'lineBuilding'];

        const sortedDocs = sortDocumentByGeometryArea(docs,[]);

        expect(sortedDocs.map(doc => doc.doc.resource.identifier)).toEqual(expectedOrder);
    });


    // eslint-disable-next-line max-len
    it('should sort Document by FieldGeometry area taking selected Docs into account. Selected docs should be sorted at the end of the array', () => {

        const docs = [tBu1, tLineBuilding, tMultiPolyTrench, tPointBuilding];
        const expectedOrder = ['multiTrench', 'lineBuilding', 'B1', 'pointBuilding'];

        const sortedDocs = sortDocumentByGeometryArea(docs,[pointBuilding._id,bu1._id]);

        expect(sortedDocs.map(doc => doc.doc.resource.identifier)).toEqual(expectedOrder);
    });


    it('should detect if a point is inside or outside a simple polygon without holes', () => {

        const polygon = [[2,2],[2,5],[5,9],[8,7],[9,4],[5,2]];
        const point1 = [4,4];
        const point2 = [2,9];

        expect(isPointInRingCoordinates(point1, polygon)).toBe(true);
        expect(isPointInRingCoordinates(point2, polygon)).toBe(false);
    });


    it('should detect if a point is inside or outside a polygon WITH holes', () => {

        const p_inside = [3,4];
        const p_inHole = [5,5];
        const p_outOuterRing = [10,9];

        expect(isPointInPolygon(p_inside, polygonWithHole)).toBe(true);
        expect(isPointInPolygon(p_inHole, polygonWithHole)).toBe(false);
        expect(isPointInPolygon(p_outOuterRing, polygonWithHole)).toBe(false);
    });


    it('should detect if a point is inside or outside a multipolygon', () => {

        const p_inside = [14,10];
        const p_outside = [3,12];
        const p_inHole = [4.5,4];
        
        expect(isPointInMultiPolygon(p_inside, multiPolygon)).toBe(true);
        expect(isPointInMultiPolygon(p_outside, multiPolygon)).toBe(false);
        expect(isPointInMultiPolygon(p_inHole, multiPolygon)).toBe(false);
    });


    it('should detect if a polygon is positioned inside another polygon',() => {

        const outerPolygon = [polygonWithHole[0]];
        const innerPolygon = [polygonWithHole[1]];
        const polygonAtOtherPosition = multiPolygon[1];
        const polyWithOnePointOutsideOuterPolygon = [[[4,2],[2,7],[5,7],[6,4]]];

        expect(isPolygonInPolygon(innerPolygon, outerPolygon)).toBe(true);
        expect(isPolygonInPolygon(outerPolygon, innerPolygon)).toBe(false);
        expect(isPolygonInPolygon(innerPolygon, polygonAtOtherPosition)).toBe(false);
        expect(isPolygonInPolygon(polyWithOnePointOutsideOuterPolygon, outerPolygon)).toBe(true);
    });


    it('should detect if a polygon is positioned in one of the polygon of a multi polygon',() => {

        const polygonOut = [[[3,14],[5,14],[5,12],[3,12]]];
        const polyPartiallyInside = [[[9,1],[7,3],[7,5],[8,6],[10,2]]];
        
        expect(isPolygonInMultiPolygon(polygonOut, multiPolygon)).toBe(false);
        expect(isPolygonInMultiPolygon(polyPartiallyInside, multiPolygon)).toBe(true);
    });


    it('should detect if a  point line is positioned in a polygon', () => {
        const polygon = [[[11,10], [15,12], [15,8], [14,9] ,[13,8]]];
        const lineString = [[12,12],[14,10.5],[16,12]];

        expect(isLineStringInPolygon(lineString,polygon)).toBe(true);
    });

});

const tBu1: TransformedDocument = {
    doc: bu1,
    transformedCoordinates: [
        [
            [621.7385735809803, 451.1022099405527],
            [675.4748869910836, 451.1022099405527],
            [675.4748869910836, 409.1501757800579],
            [621.7385735809803, 409.1501757800579]
        ]
      ]
};

const tLineBuilding: TransformedDocument = {
    doc: lineBuilding,
    transformedCoordinates: [
        [473.25665494799614, 252.18357609212399],
        [288.479156203568, 593.456303358078],
      ]
};


const tMultiPolyTrench: TransformedDocument = {
    doc: multiPolyTrench,
    transformedCoordinates: [
        [
          [
            [544.9050728231668, 698.1007031649351],
            [630.6946258172393, 716.9555499702692],
            [620.324460066855, 805.5733299851418],
            [541.1341034621, 793.317679554224]
          ]
        ],
        [
          [
            [673.1180311366916, 826.3136614710093],
            [739.1099949777126, 860.2523857355118],
            [705.1712707132101, 906.4467604160309],
            [682.5454545468092, 938.5],
            [660.8623807132244, 919.6451531797647],
            [664.6333500742912, 890.4201406240463],
            [681.6027122065425, 866.8515821099281],
            [651.4349573031068, 858.3669010549784]
          ]
        ]
      ]
};

const tPointBuilding: TransformedDocument = {
    doc: pointBuilding,
    transformedCoordinates: [490.2260170727968, 546.3191863298416]
};