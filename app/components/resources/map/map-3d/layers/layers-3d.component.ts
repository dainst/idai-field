import * as THREE from 'three';
import {Component, Input, OnChanges} from '@angular/core';
import {Document} from 'idai-components-2/core';
import {IdaiFieldDocument} from 'idai-components-2/idai-field-model';
import {Layer3DManager} from './layer-3d-manager';
import {Layer3DMeshManager} from './layer-3d-mesh-manager';
import {Map3DComponent} from '../map-3d.component';
import {ListDiffResult} from '../../layer-manager';
import {SettingsService} from '../../../../../core/settings/settings-service';


@Component({
    moduleId: module.id,
    selector: 'layers-3d',
    templateUrl: './layers-3d.html'
})
/**
 * @author Thomas Kleinke
 */
export class Layers3DComponent implements OnChanges {

    @Input() mainTypeDocument: IdaiFieldDocument;

    public layers: Array<Document> = [];

    private layerMeshManager: Layer3DMeshManager;


    constructor(private map3DComponent: Map3DComponent,
                private layerManager: Layer3DManager,
                private settingsService: SettingsService) {

        this.layerManager.reset();
    }


    async ngOnChanges() {

        if (!this.layerMeshManager) {
            this.layerMeshManager = new Layer3DMeshManager(this.map3DComponent.getViewer(),
                this.settingsService);
        }

        await this.updateLayers();
    }


    public async toggleLayer(layer: Document) {

        const id: string = layer.resource.id as string;

        this.layerManager.toggleLayer(id, this.mainTypeDocument);

        if (this.layerManager.isActiveLayer(id as string)) {
            await this.layerMeshManager.addMesh(id);
        } else {
            this.layerMeshManager.removeMesh(id);
        }
    }


    public focusLayer(layer: Document) {

        const mesh: THREE.Mesh = this.layerMeshManager.getMesh(layer.resource.id as string) as THREE.Mesh;
        this.map3DComponent.getControls().focusMesh(mesh);
    }


    private async updateLayers() {

        const { layers, activeLayersChange }
            = await this.layerManager.initializeLayers(this.mainTypeDocument);

        this.layers = layers;
        this.handleActiveLayersChange(activeLayersChange);
    }


    private handleActiveLayersChange(change: ListDiffResult) {

        change.removed.forEach(layerId => this.layerMeshManager.removeMesh(layerId));
        change.added.forEach(layerId => this.layerMeshManager.addMesh(layerId));
    }
}