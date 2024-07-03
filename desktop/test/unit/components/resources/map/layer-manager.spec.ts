import { describe, expect, test, beforeEach } from '@jest/globals';
import { doc, ImageDocument } from 'idai-field-core';
import { LayerManager } from '../../../../../src/app/components/resources/map/map/layers/layer-manager';


/**
 * @author Daniel de Oliveira
 * @author Thomas Kleinke
 */
describe('LayerManager', () => {

    let layerManager: LayerManager;

    const layerDocuments: Array<ImageDocument> = [
        doc('Layer 1', 'layer1', 'Image', 'l1') as ImageDocument,
        doc('Layer 2', 'layer2', 'Image', 'l2') as ImageDocument,
    ];

    const projectDocument: any = {
        resource: {
            id: 'project',
            relations: {
                hasMapLayer: ['l1', 'l2'],
                hasDefaultMapLayer: ['l2']
            }
        }
    };

    let mockViewFacade;


    beforeEach(() => {

        const mockDatastore: any = {
            getMultiple: jest.fn().mockReturnValue(Promise.resolve(layerDocuments)),
            get: jest.fn().mockReturnValue(Promise.resolve(projectDocument))
        };

        mockViewFacade = {
            getActiveLayersIds: jest.fn().mockReturnValue([]),
            setActiveLayersIds: jest.fn(),
            getCurrentOperation: jest.fn()
        };

        layerManager = new LayerManager(mockDatastore, mockViewFacade, undefined);
    });


    it('initialize layers', async () => {

        const activeLayersChange = await layerManager.initializeLayers();

        expect(layerManager.getLayerGroups().length).toBe(1);
        expect(layerManager.getLayerGroups()[0].layers[0].resource.id).toEqual('l1');
        expect(layerManager.getLayerGroups()[0].layers[1].resource.id).toEqual('l2');

        expect(activeLayersChange.added.length).toBe(0);
        expect(activeLayersChange.removed.length).toBe(0);
    });


    it('restore active layers from resources state', async () => {

        mockViewFacade.getActiveLayersIds.mockReturnValue(['l2']);

        const activeLayersChange = await layerManager.initializeLayers();

        expect(activeLayersChange.added.length).toBe(1);
        expect(activeLayersChange.added[0]).toEqual('l2');
        expect(activeLayersChange.removed.length).toBe(0);
    });


    it('add and remove correct layers when initializing with different resources states', async () => {

        mockViewFacade.getActiveLayersIds.mockReturnValue(['l2']);

        await layerManager.initializeLayers();

        mockViewFacade.getActiveLayersIds.mockReturnValue(['l1']);

        const activeLayersChange = await layerManager.initializeLayers();

        expect(activeLayersChange.added.length).toBe(1);
        expect(activeLayersChange.added[0]).toEqual('l1');
        expect(activeLayersChange.removed.length).toBe(1);
        expect(activeLayersChange.removed[0]).toEqual('l2');
    });


    test('add or remove no layers if the layers are initialized with the same resources state again', async () => {

        mockViewFacade.getActiveLayersIds.mockReturnValue(['l2']);

        await layerManager.initializeLayers();
        const activeLayersChange = await layerManager.initializeLayers();

        expect(activeLayersChange.added.length).toBe(0);
        expect(activeLayersChange.removed.length).toBe(0);
    });


    test('use default layers if no active layers ids are stored in resources state', async () => {

        mockViewFacade.getActiveLayersIds.mockReturnValue(undefined);

        const activeLayersChange = await layerManager.initializeLayers();

        expect(activeLayersChange.added.length).toBe(1);
        expect(activeLayersChange.added[0]).toEqual('l2');
        expect(activeLayersChange.removed.length).toBe(0);
    });
});
