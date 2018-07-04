import {
    LayerManager,
    LayersInitializationResult
} from '../../../../../app/components/resources/map/map/layer-manager';
import {IdaiFieldImageDocument} from '../../../../../app/core/model/idai-field-image-document';
import {IdaiFieldDocument} from 'idai-components-2/field';
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
    let layerIdSubscription;


    beforeEach(() => {

        const mockDatastore = jasmine.createSpyObj('datastore', ['find']);
        mockDatastore.find.and.returnValue(Promise.resolve({ documents: layerDocuments }));

        const mockImageTypeUtility = jasmine.createSpyObj('imageTypeUtility',
            ['getImageTypeNames']);
        mockImageTypeUtility.getImageTypeNames.and.returnValue(['Image']);

        mockViewFacade = jasmine.createSpyObj('viewFacade',
            ['getActiveLayersIds', 'setActiveLayersIds', 'layerIdsNotifications']);
        mockViewFacade.layerIdsNotifications.and.returnValue({subscribe: layerIdSubs => layerIdSubscription = layerIdSubs});

        layerManager = new LayerManager(mockDatastore, mockViewFacade);
    });


    it('add two layers', async done => {

        layerManager.layerIdsNotifications().subscribe((layersInitializationResult: LayersInitializationResult) => {

            expect(layersInitializationResult.layers.length).toEqual(2);
            expect(layersInitializationResult.layers[0].resource.id).toEqual('l1');
            expect(layersInitializationResult.layers[1].resource.id).toEqual('l2');
            expect(layersInitializationResult.activeLayersChange.added).toEqual(['l1', 'l2']);
            expect(layersInitializationResult.activeLayersChange.removed).toEqual([]);
            done();
        });
        await layerIdSubscription(['l1', 'l2'], true);
    });



    it('add two layers, then remove one', async done => {

        let i = 0;
        layerManager.layerIdsNotifications().subscribe((layersInitializationResult: LayersInitializationResult) => {

            if (i === 0) {
                i++;
                return;
            }

            expect(layersInitializationResult.layers.length).toEqual(2);
            expect(layersInitializationResult.layers[0].resource.id).toEqual('l1');
            expect(layersInitializationResult.layers[1].resource.id).toEqual('l2');
            expect(layersInitializationResult.activeLayersChange.added).toEqual([]);
            expect(layersInitializationResult.activeLayersChange.removed).toEqual(['l2']);
            done();
        });

        await layerIdSubscription(['l1', 'l2'], true);
        await layerIdSubscription(['l1'], true);
    });


    it('add two layers, then replace one with the other', async done => {

        let i = 0;
        layerManager.layerIdsNotifications().subscribe((layersInitializationResult: LayersInitializationResult) => {

            if (i === 0) {
                i++;
                return;
            }

            expect(layersInitializationResult.layers.length).toEqual(2);
            expect(layersInitializationResult.layers[0].resource.id).toEqual('l1');
            expect(layersInitializationResult.layers[1].resource.id).toEqual('l2');
            expect(layersInitializationResult.activeLayersChange.added).toEqual(['l2']);
            expect(layersInitializationResult.activeLayersChange.removed).toEqual(['l1']);
            done();
        });

        await layerIdSubscription(['l1'], true);
        await layerIdSubscription(['l2'], true);
    });


    it('add and remove two layers', async done => {

        let i = 0;
        layerManager.layerIdsNotifications().subscribe((layersInitializationResult: LayersInitializationResult) => {

            if (i === 0) {
                i++;
                return;
            }

            expect(layersInitializationResult.layers.length).toEqual(2);
            expect(layersInitializationResult.layers[0].resource.id).toEqual('l1');
            expect(layersInitializationResult.layers[1].resource.id).toEqual('l2');
            expect(layersInitializationResult.activeLayersChange.added).toEqual([]);
            expect(layersInitializationResult.activeLayersChange.removed).toEqual(['l1', 'l2']);
            done();
        });

        await layerIdSubscription(['l1', 'l2'], true);
        await layerIdSubscription([], true);
    });
});