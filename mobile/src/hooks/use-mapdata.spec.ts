import { renderHook } from '@testing-library/react-hooks';
import { PouchdbManager } from 'idai-field-core';
import { identityMatrix4 } from 'react-native-redash';
import { bu1 } from '../../test_data/test_docs/bu1';
import { lineBuilding } from '../../test_data/test_docs/lineBuilding';
import { multiPolyTrench } from '../../test_data/test_docs/multiPolyTrench';
import { pointBuilding } from '../../test_data/test_docs/pointBuilding';
import { r1 } from '../../test_data/test_docs/r1';
import { si1 } from '../../test_data/test_docs/si1';
import { ViewPort } from '../components/Project/Map/geo-svg';
import { DocumentRepository } from '../repositories/document-repository';
import useMapData from './use-mapdata';


const bu1Id = bu1.resource.id;
const lineBuildingId = lineBuilding.resource.id;
const multiPolyTrenchId = multiPolyTrench.resource.id;
const pointBuildingId = pointBuilding.resource.id;
const r1Id = r1.resource.id;
const si1Id = si1.resource.id;

jest.mock('../repositories/document-repository');
jest.mock('idai-field-core');


describe('useMapData',() => {


    let repository: DocumentRepository;
    let viewPort: ViewPort;

    beforeAll(async () => {
        repository = await DocumentRepository.init('test', [], new PouchdbManager(name => new PouchDB(name)));
        viewPort = { x:0, y:0, width: 500, height: 1100 };
    });

    const hook = () =>
        renderHook(({ repository, viewPort, selectedDocIds }) =>
            useMapData(repository, viewPort, selectedDocIds),
            {
                initialProps: {
                    repository,
                    viewPort,
                    selectedDocIds: [bu1Id, si1Id]
                }
            }
        );


    it('should setup the hook correctly',async () => {
        const { result, waitForNextUpdate } = hook();
        await waitForNextUpdate();
        
        const [docIds, geoMap, transformMatrix] = result.current;
        
        //assert docIds
        const expectedDocOrdering = [multiPolyTrenchId, si1Id, bu1Id, r1Id, pointBuildingId, lineBuildingId];
        expect(docIds?.length).toEqual(expectedDocOrdering.length);
        expect(docIds).toEqual(expectedDocOrdering);
        
        //assert transformation matrix
        expect(transformMatrix).not.toEqual(identityMatrix4);

        //assert geoMap
        let docCnt = 0;
        geoMap?.forEach((value, key) => {
            if(key === bu1Id || key === si1Id) expect(value.isSelected).toEqual(true);
            else expect(value.isSelected).toBeUndefined();

            docCnt += 1;
        });
        expect(docCnt).toBe(docIds?.length);
        
    });


    it('should update the selected Docs of GeoMap correctly', async () => {

        const newSelectedDocs = [r1Id, si1Id];
        
        const { result, rerender, waitForNextUpdate } = hook();
        rerender({ repository,viewPort,selectedDocIds: newSelectedDocs });
        await waitForNextUpdate();

        const [_docIds, geoMap, _transformMatrix] = result.current;
        
        geoMap?.forEach((value, key) => {
            if(newSelectedDocs.includes(key)) expect(value.isSelected).toEqual(true);
            else expect(value.isSelected).toBeFalsy();
        });
    });

    
    xit('should define the viewBox correctly if no Docs are selected', async () => {

        const selectedDocs:string[] = [];

        const { result, rerender, waitForNextUpdate } = hook();
        rerender({ repository,viewPort,selectedDocIds: selectedDocs });
        await waitForNextUpdate();

        const [_docIds, _geoMap, _transformMatrix, viewBox] = result.current;
        expect(viewBox).toEqual([viewPort.x, viewPort.y, viewPort.width, viewPort.height]);

       
    });


});
