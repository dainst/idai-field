import {LayerManager} from '../../../../../app/components/resources/map/map/layer-manager';
import {IdaiFieldImageDocument} from 'idai-components-2';
import {IdaiFieldDocument} from 'idai-components-2';
import {Static} from '../../../static';


/**
 * @author Daniel de Oliveira
 * @author Thomas Kleinke
 */
describe('LayerManager', () => {

    let layerManager: LayerManager;

    const layerDocuments: Array<IdaiFieldImageDocument> = [
        Static.doc('Layer 1', 'layer1', 'Image', 'l1') as IdaiFieldImageDocument,
        Static.doc('Layer 2', 'layer2', 'Image', 'l2') as IdaiFieldImageDocument,
    ];

    const mainTypeDocument: IdaiFieldDocument
        = Static.doc('Main Type Document', 'MTD', 'trench', 'mtd') as IdaiFieldDocument;

    let mockViewFacade;


    beforeEach(() => {

        const mockDatastore = jasmine.createSpyObj('datastore', ['find']);
        mockDatastore.find.and.returnValue(Promise.resolve({ documents: layerDocuments }));

        const mockImageTypeUtility = jasmine.createSpyObj('imageTypeUtility',
            ['getImageTypeNames']);
        mockImageTypeUtility.getImageTypeNames.and.returnValue(['Image']);

        mockViewFacade = jasmine.createSpyObj('viewFacade',
            ['getActiveLayersIds', 'setActiveLayersIds']);
        mockViewFacade.getActiveLayersIds.and.returnValue([]);

        layerManager = new LayerManager(mockDatastore, mockViewFacade);
    });


    it('initialize layers', async done => {

        const { layers, activeLayersChange } = await layerManager.initializeLayers(true);

        expect(layers.length).toBe(2);
        expect(layers[0].resource.id).toEqual('l1');
        expect(layers[1].resource.id).toEqual('l2');

        expect(activeLayersChange.added.length).toBe(0);
        expect(activeLayersChange.removed.length).toBe(0);

        done();
    });


    it('restore active layers from resources state', async done => {

        mockViewFacade.getActiveLayersIds.and.returnValue([ 'l2' ]);

        const { activeLayersChange } = await layerManager.initializeLayers(true);

        expect(activeLayersChange.added.length).toBe(1);
        expect(activeLayersChange.added[0]).toEqual('l2');
        expect(activeLayersChange.removed.length).toBe(0);

        done();
    });


    it('add and remove correct layers when initializing with different resources states',
            async done => {

        mockViewFacade.getActiveLayersIds.and.returnValue([ 'l2' ]);

        await layerManager.initializeLayers(true);

        mockViewFacade.getActiveLayersIds.and.returnValue([ 'l1' ]);

        const { activeLayersChange } = await layerManager.initializeLayers(true);

        expect(activeLayersChange.added.length).toBe(1);
        expect(activeLayersChange.added[0]).toEqual('l1');
        expect(activeLayersChange.removed.length).toBe(1);
        expect(activeLayersChange.removed[0]).toEqual('l2');

        done();
    });


    it('add or remove no layers if the layers are initialized with the same resources state again',
        async done => {

            mockViewFacade.getActiveLayersIds.and.returnValue([ 'l2' ]);

            await layerManager.initializeLayers(true);
            const { activeLayersChange } = await layerManager.initializeLayers(true);

            expect(activeLayersChange.added.length).toBe(0);
            expect(activeLayersChange.removed.length).toBe(0);

            done();
        });
});