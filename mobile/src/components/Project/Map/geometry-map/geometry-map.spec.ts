import { bu1 } from '../../../../../test_data/test_docs/bu1';
import { lineBuilding } from '../../../../../test_data/test_docs/lineBuilding';
import { multiPolyTrench } from '../../../../../test_data/test_docs/multiPolyTrench';
import { r1 } from '../../../../../test_data/test_docs/r1';
import { si1 } from '../../../../../test_data/test_docs/si1';
import { si3 } from '../../../../../test_data/test_docs/si3';
import { si4 } from '../../../../../test_data/test_docs/si4';
import { t2 } from '../../../../../test_data/test_docs/t2';
import { tf1 } from '../../../../../test_data/test_docs/tf1';
import { getGeometryBoundings, setupTransformationMatrix } from '../geo-svg';
import { pointRadius } from '../geo-svg/constants';
import { ViewPort } from '../geo-svg/geojson-cs-to-svg-cs/viewport-utils/viewport-utils';
import { GeoMapEntry, setupGeoMap } from './geometry-map';


const geoDocuments = [bu1, lineBuilding, t2, multiPolyTrench, r1, tf1, si4, si1, si3];
const viewPort: ViewPort = { x: 0,y: 0, width: 752.941162109375, height: 1067.2940673828125 };
let geoMap: Map<string, GeoMapEntry>;

const bu1Id = bu1.resource.id;
const t2Id = t2.resource.id;
const r1Id = r1.resource.id;
const multiPolyTrenchId = multiPolyTrench.resource.id;
const si4Id = si4.resource.id;
const tf1Id = tf1.resource.id;
const lineBuildingId = lineBuilding.resource.id;
const si1Id = si1.resource.id;
const si3Id = si3.resource.id;

describe('geometry-map', () => {

    beforeAll(() => {
        
        const geoBoundings = getGeometryBoundings(geoDocuments);
        const transMatrix = setupTransformationMatrix(geoBoundings, viewPort);
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        geoMap = setupGeoMap(geoDocuments, transMatrix)!;
      
    });


    it('should not include itself as a parent', () => {

        const t2Childs = geoMap.get(t2Id)?.parents;
        expect(t2Childs?.includes(t2Id)).toBe(false);

        const b1Childs = geoMap.get(bu1Id)?.parents;
        expect(b1Childs?.includes(bu1Id)).toBe(false);
    });


    it('should include the area for each geometry', () => {

        const expectedAreas = {
            [t2Id]: 24766.862556,
            [multiPolyTrenchId]: 11565.606821921596,
            [si1Id]: 7315.8884305,
            [bu1Id]: 5451.804814123214,
            [r1Id]: 2591.1655593290925,
            [si4Id]: 667.521673,
            [tf1Id]:  Math.PI * Math.pow(pointRadius,2),
            [lineBuildingId]: 0,
            [si3Id]: 5312.58344,
        };

        
        geoMap.forEach((val, key) => {
            expect(val.area).toBeCloseTo(expectedAreas[key],2);
        });

    });


    it('should have bu1 as parent of r1', () => {

        const parents = geoMap.get(r1Id)?.parents;

        expect(parents?.includes(bu1Id)).toBe(true);
        expect(parents?.length).toBe(1);
    });

    
    it('should have si4 as child of t2',() => {
        
        const parents = geoMap.get(si4Id)?.parents;

        expect(parents?.includes(t2Id)).toBe(true);
        expect(parents?.includes(si1Id)).toBe(true);
        expect(parents?.length).toBe(2);
    });


    it('should have transformed coords for each key', () => {

        geoMap.forEach((val, _key) => {
            expect(val.transformedCoords).not.toBe(undefined);
            expect(val.transformedCoords.length).not.toBe(0);
        });
    });
    
    
    it('should have the correct geoType in GeoMapEntry', () => {

        expect(geoMap.get(lineBuildingId)?.doc).toEqual(lineBuilding);
        expect(geoMap.get(r1Id)?.doc).toEqual(r1);
        expect(geoMap.get(multiPolyTrenchId)?.doc).toEqual(multiPolyTrench);
    });

});