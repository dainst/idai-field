import {Component, SimpleChanges} from '@angular/core';
import {MapComponent} from 'idai-components-2/idai-field-map';
import {Messages} from 'idai-components-2/messages';
import {ConfigLoader} from 'idai-components-2/configuration';
import {ImageContainer} from '../../../../core/imagestore/image-container';
import {LayerManager, ListDiffResult} from './layer-manager';
import {IdaiFieldImageDocument} from '../../../../core/model/idai-field-image-document';
import {LayerImageProvider} from './layer-image-provider';


@Component({
    moduleId: module.id,
    selector: 'layer-map',
    templateUrl: './layer-map.html'
})
/**
 * @author Thomas Kleinke
 * @author Daniel de Oliveira
 */
export class LayerMapComponent extends MapComponent {

    public layers: Array<IdaiFieldImageDocument> = [];

    private panes: { [resourceId: string]: any } = {};
    private imageOverlays: { [resourceId: string]: L.ImageOverlay } = {};
    private layersUpdate: boolean = false;


    constructor(private layerManager: LayerManager,
                private layerImageProvider: LayerImageProvider,
                protected messages: Messages,
                configLoader: ConfigLoader) {

        super(configLoader);

        this.layerManager.reset();
    }


    public toggleLayer(layer: IdaiFieldImageDocument) {

        if (this.layerManager.toggleLayer(layer.resource.id, this.mainTypeDocument)) {
            this.addLayerToMap(layer.resource.id);
        } else {
            this.removeLayerFromMap(layer.resource.id);
        }
    }


    /**
     * Called by MapComponent.ngOnChange
     */
    protected async updateMap(changes: SimpleChanges): Promise<any> {

        if (changes['documents'] && changes['documents'].currentValue) this.layersUpdate = true;

        if (!this.update) return Promise.resolve();

        await super.updateMap(changes);

        if (this.layersUpdate) {
            this.layersUpdate = false;
            return this.updateLayers();
        }
    }


    private async updateLayers(): Promise<any> {

        if (!this.mainTypeDocument) return;

        this.layerImageProvider.reset();

        const { layers, activeLayersChange } =
            await this.layerManager.initializeLayers(this.mainTypeDocument);

        this.layers = layers;
        this.initializePanes();
        this.handleActiveLayersChange(activeLayersChange);
    }


    private handleActiveLayersChange(change: ListDiffResult) {

        change.removed.forEach(layerId => this.removeLayerFromMap(layerId));
        change.added.forEach(layerId => this.addLayerToMap(layerId));
    }


    private initializePanes() {

        let zIndex = 0;
        this.layers
            .filter(layer => !this.panes[layer.resource.id])
            .forEach(layer => {
                const pane = this.map.createPane(layer.resource.id);
                pane.style.zIndex = String(zIndex++);
                this.panes[layer.resource.id] = pane;
            });
    }


    private async addLayerToMap(resourceId: string) {

        const layerDocument: IdaiFieldImageDocument
            = this.layers.find(layer => layer.resource.id == resourceId);
        if (!layerDocument) return;

        const imageContainer: ImageContainer = await this.layerImageProvider.getImageContainer(resourceId);

        const georeference = layerDocument.resource.georeference;
        this.imageOverlays[resourceId] = L.imageOverlay(imageContainer.imgSrc,
            [georeference.topLeftCoordinates,
             georeference.topRightCoordinates,
             georeference.bottomLeftCoordinates],
            { pane: layerDocument.resource.id }).addTo(this.map);
    }


    private async removeLayerFromMap(resourceId: string) {

        const imageOverlay = this.imageOverlays[resourceId];
        if (!imageOverlay) {
            console.warn('Failed to remove image ' + resourceId + ' from map. Image overlay not found.');
            return;
        }

        this.map.removeLayer(imageOverlay);
    }


    public focusLayer(layer: IdaiFieldImageDocument) {

        let georeference = layer.resource.georeference;
        let bounds = [];

        bounds.push(L.latLng(georeference.topLeftCoordinates));
        bounds.push(L.latLng(georeference.topRightCoordinates));
        bounds.push(L.latLng(georeference.bottomLeftCoordinates));

        this.map.fitBounds(bounds);
    }
}
