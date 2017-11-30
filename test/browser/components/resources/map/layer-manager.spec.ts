import {LayerManager} from '../../../../../app/components/resources/map/map/layer-manager';
import {IdaiFieldImageDocument} from '../../../../../app/core/model/idai-field-image-document';
import {Static} from '../../../static';
import {IdaiFieldDocument} from 'idai-components-2/idai-field-model';


/**
 * @author Daniel de Oliveira
 * @author Thomas Kleinke
 */
export function main() {

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
            mockDatastore.find.and.returnValue(Promise.resolve(layerDocuments));

            const mockImageTypeUtility = jasmine.createSpyObj('imageTypeUtility',
                ['getProjectImageTypeNames']);
            mockImageTypeUtility.getProjectImageTypeNames.and.returnValue(['Image']);

            mockViewFacade = jasmine.createSpyObj('viewFacade',
                ['getActiveLayersIds', 'setActiveLayersIds']);
            mockViewFacade.getActiveLayersIds.and.returnValue([]);

            layerManager = new LayerManager(mockDatastore, mockImageTypeUtility, mockViewFacade);
        });


        it('initialize layers', async done => {

            const { layers, activeLayersChange } = await layerManager.initializeLayers(mainTypeDocument);

            expect(layers.length).toBe(2);
            expect(layers[0].resource.id).toEqual('l1');
            expect(layers[1].resource.id).toEqual('l2');

            expect(activeLayersChange.added.length).toBe(0);
            expect(activeLayersChange.removed.length).toBe(0);

            done();
        });


        it('restore active layers from resources state', async done => {

            mockViewFacade.getActiveLayersIds.and.returnValue([ 'l2' ]);

            const { activeLayersChange } = await layerManager.initializeLayers(mainTypeDocument);

            expect(activeLayersChange.added.length).toBe(1);
            expect(activeLayersChange.added[0]).toEqual('l2');
            expect(activeLayersChange.removed.length).toBe(0);

            done();
        });


        it('add and remove correct layers when initializing with different resources states',
                async done => {

            mockViewFacade.getActiveLayersIds.and.returnValue([ 'l2' ]);

            await layerManager.initializeLayers(mainTypeDocument);

            mockViewFacade.getActiveLayersIds.and.returnValue([ 'l1' ]);

            const { activeLayersChange } = await layerManager.initializeLayers(mainTypeDocument);

            expect(activeLayersChange.added.length).toBe(1);
            expect(activeLayersChange.added[0]).toEqual('l1');
            expect(activeLayersChange.removed.length).toBe(1);
            expect(activeLayersChange.removed[0]).toEqual('l2');

            done();
        });


        it('add or remove no layers if the layers are initialized with the same resources state again',
            async done => {

                mockViewFacade.getActiveLayersIds.and.returnValue([ 'l2' ]);

                await layerManager.initializeLayers(mainTypeDocument);
                const { activeLayersChange } = await layerManager.initializeLayers(mainTypeDocument);

                expect(activeLayersChange.added.length).toBe(0);
                expect(activeLayersChange.removed.length).toBe(0);

                done();
            });
    });
}