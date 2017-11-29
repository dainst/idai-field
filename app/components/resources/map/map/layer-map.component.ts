import {Component, SimpleChanges} from '@angular/core';
import {MapComponent} from 'idai-components-2/idai-field-map';
import {Messages} from 'idai-components-2/messages';
import {ConfigLoader} from 'idai-components-2/configuration';
import {ImageContainer} from '../../../../core/imagestore/image-container';
import {ActiveLayersChange, LayerManager, LayersInitializationResult} from './layer-manager';

@Component({
    moduleId: module.id,
    selector: 'layer-map',
    templateUrl: './layer-map.html'
})
/**
 * @author Thomas Kleinke
 */
export class LayerMapComponent extends MapComponent {

    public layers: Array<ImageContainer> = [];

    protected panes: { [id: string]: any } = {};

    private layersUpdate: boolean = false;


    constructor(private layerManager: LayerManager,
                protected messages: Messages,
                configLoader: ConfigLoader) {

        super(configLoader);
    }


    protected updateMap(changes: SimpleChanges): Promise<any> {

        if (changes['documents'] && changes['documents'].currentValue) this.layersUpdate = true;

        if (!this.update) return Promise.resolve();

        return super.updateMap(changes)
            .then(() => {
                if (this.layersUpdate) {
                    this.layersUpdate = false;
                    return this.updateLayers();
                }
            });
    }


    private async updateLayers(): Promise<any> {

        const { layers, activeLayersChange } = await this.layerManager.initializeLayers(this.mainTypeDocument);

        console.log('layers', layers);
        console.log('activeLayersChange', activeLayersChange);

        this.layers = layers;
        this.initializePanes();
        this.handleActiveLayersChange(activeLayersChange);
    }


    private handleActiveLayersChange(change: ActiveLayersChange) {

        for (let layer of change.removed) {
            this.removeLayerFromMap(layer);
        }

        for (let layer of change.added) {
            this.addLayerToMap(layer);
        }
    }


    private initializePanes() {

        for (let layer of this.layers) {
            const id = layer.document.resource.id;
            if (!this.panes[id]) {
                const pane = this.map.createPane(id);
                pane.style.zIndex = String(layer.zIndex);
                this.panes[id] = pane;
            }
        }
    }


    private addLayerToMap(layer: ImageContainer) {

        let georef = layer.document.resource.georeference;
        layer.object = L.imageOverlay(layer.imgSrc,
            [georef.topLeftCoordinates,
            georef.topRightCoordinates,
            georef.bottomLeftCoordinates],
            { pane: layer.document.resource.id }).addTo(this.map);
    }


    private removeLayerFromMap(layer: ImageContainer) {

        this.map.removeLayer(layer.object);
    }


    public toggleLayer(layer: ImageContainer) {

        const index = this.layerManager.activeLayers.indexOf(layer);
        if (index == -1) {
            this.addLayerToMap(layer);
            this.layerManager.activeLayers.push(layer);
        } else {
            this.layerManager.activeLayers.splice(index, 1);
            this.map.removeLayer(layer.object);
        }

        // TODO call from layer manager
        this.layerManager.saveActiveLayersIdsInResourcesState(this.mainTypeDocument);
    }


    public focusLayer(layer: ImageContainer) {

        let georeference = layer.document.resource.georeference;
        let bounds = [];

        bounds.push(L.latLng(georeference.topLeftCoordinates));
        bounds.push(L.latLng(georeference.topRightCoordinates));
        bounds.push(L.latLng(georeference.bottomLeftCoordinates));

        this.map.fitBounds(bounds);
    }


    public getLayerLabel(layer: ImageContainer): string {

        let label: string;

        if (layer.document.resource.shortDescription && layer.document.resource.shortDescription != '') {
            label = layer.document.resource.shortDescription;
        } else {
            label = layer.document.resource.identifier;
        }

        if (label.length > 48) label = label.substring(0, 45) + '...';

        return label;
    }


    public isActiveLayer = (layer: ImageContainer) => this.layerManager.isActiveLayer(layer);
}
