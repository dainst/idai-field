import * as THREE from 'three';
import {OnChanges} from '@angular/core';
import {Document} from 'idai-components-2';
import {Map3DComponent} from '../map-3d.component';
import {LayerManager, ListDiffResult} from '../../layer-manager';
import {LayerMeshManager} from './layer-mesh-manager';
import {MeshLoadingProgress} from '../../../../core-3d/mesh-loading/mesh-loading-progress';


/**
 * @author Thomas Kleinke
 */
export class LayersComponent implements OnChanges {

    public layers: Array<Document> = [];


    constructor(private map3DComponent: Map3DComponent,
                private layerManager: LayerManager<Document>,
                private layerMeshManager: LayerMeshManager,
                private meshLoadingProgress: MeshLoadingProgress) {

        this.layerManager.reset();
    }


    async ngOnChanges() {

        await this.updateLayers();
    }


    public async toggleLayer(layer: Document) {

        if (this.meshLoadingProgress.isLoading()) return;

        const id: string = layer.resource.id as string;

        this.layerManager.toggleLayer(id);

        if (this.layerManager.isActiveLayer(id)) {
            await this.addLayerMesh(id);
        } else {
            await this.removeLayerMesh(id);
        }

        this.map3DComponent.getCameraManager().resetPivotPoint();
    }


    public async focusLayer(layer: Document) {

        if (this.meshLoadingProgress.isLoading()) return;

        const mesh: THREE.Mesh = await this.layerMeshManager.getMesh(layer.resource.id as string);
        this.map3DComponent.getControls().focusMesh(mesh);
    }


    private async updateLayers() {

        const { layers, activeLayersChange } = await this.layerManager.initializeLayers();

        this.layers = layers;
        this.handleActiveLayersChange(activeLayersChange);
    }


    private handleActiveLayersChange(change: ListDiffResult) {

        change.removed.forEach(layerId => this.removeLayerMesh(layerId));
        change.added.forEach(layerId => this.addLayerMesh(layerId));
    }


    private async addLayerMesh(id: string) {

        const mesh: THREE.Mesh = await this.layerMeshManager.getMesh(id);
        this.map3DComponent.getSceneManager().add(mesh);
    }


    private async removeLayerMesh(id: string) {

        const mesh: THREE.Mesh = await this.layerMeshManager.getMesh(id);
        this.map3DComponent.getSceneManager().remove(mesh);
    }
}