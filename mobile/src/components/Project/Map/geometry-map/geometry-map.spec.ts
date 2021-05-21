import { bu1 } from '../../../../../test_data/test_docs/bu1';
import { lineBuilding } from '../../../../../test_data/test_docs/lineBuilding';
import { multiPolyTrench } from '../../../../../test_data/test_docs/multiPolyTrench';
import { r1 } from '../../../../../test_data/test_docs/r1';
import { si1 } from '../../../../../test_data/test_docs/si1';
import { si4 } from '../../../../../test_data/test_docs/si4';
import { t2 } from '../../../../../test_data/test_docs/t2';
import { tf1 } from '../../../../../test_data/test_docs/tf1';
import { ViewPort } from '../geo-svg/geojson-cs-to-svg-cs/viewport-utils/viewport-utils';
import { GeoMapEntry, setupGeoMap } from './geometry-map';


const geoDocuments = [bu1, lineBuilding, t2, multiPolyTrench, r1, tf1, si4, si1];
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

describe('geometry-map', () => {

    beforeAll(() => {
        
        const renderData = setupGeoMap(geoDocuments, viewPort);
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        geoMap = renderData.geoMap!;
    });


    it('should not include itself as a child', () => {

        const t2Childs = geoMap.get(t2Id)?.childs;
        expect(t2Childs?.includes(t2Id)).toBe(false);

        const b1Childs = geoMap.get(bu1Id)?.childs;
        expect(b1Childs?.includes(bu1Id)).toBe(false);
    });


    it('should be ordered by the area in descending order', () => {

        const expectedOrder = [t2Id,multiPolyTrenchId, si1Id, bu1Id, r1Id, si4Id,tf1Id,lineBuildingId ];
        let cnt = 0;
        
        expect(geoMap.size).toBe(expectedOrder.length);
        geoMap.forEach((_val, key) => {
            expect(key).toEqual(expectedOrder[cnt++]);
        });

    });


    it('should have r1 as child of bu1', () => {

        const childs = geoMap.get(bu1Id)?.childs;

        expect(childs?.includes(r1Id)).toBe(true);
        expect(childs?.length).toBe(1);
    });

    
    it('should have si4 as child of t2',() => {
        
        const childs = geoMap.get(t2Id)?.childs;

        expect(childs?.includes(si4Id)).toBe(true);
        expect(childs?.includes(si1Id)).toBe(true);
        expect(childs?.length).toBe(2);
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