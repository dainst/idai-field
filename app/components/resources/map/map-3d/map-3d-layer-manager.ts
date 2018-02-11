import * as THREE from 'three';
import {IdaiFieldDocument} from 'idai-components-2/idai-field-model';
import {Viewer3D} from '../../../../core/3d/viewer-3d';
import {Map3DLayer} from './map-3d-layer';
import {MeshLoader} from '../../../../core/3d/mesh-loader';
import {SettingsService} from '../../../../core/settings/settings-service';


/**
 * @author Thomas Kleinke
 */
export class Map3DLayerManager {

    private layers: Array<Map3DLayer> = [];
    private loader: MeshLoader;


    constructor(private viewer: Viewer3D,
                private settingsService: SettingsService) {

        this.loader = new MeshLoader(settingsService);
    }


    public async showLayersForDocuments(documents: Array<IdaiFieldDocument>) {

        if (!documents) return;

        this.removeLayers(this.getLayersToRemoveFromMap(documents));
        await this.addLayersForDocuments(documents);
    }


    public getLayerByDocumentResourceId(resourceId: string): Map3DLayer|undefined {

        return this.layers.find(object => object.document.resource.id == resourceId);
    }


    public getLayerByModelId(meshId: string): Map3DLayer|undefined {

        return this.layers.find(object => object.mesh.uuid == meshId);
    }


    private async addLayersForDocuments(documents: Array<IdaiFieldDocument>) {

        documents.filter(document => !this.isShownOnMap(document))
            .forEach(async document => await this.addLayersForDocument(document));
    }


    private removeLayers(layers: Array<Map3DLayer>) {

        layers.forEach(object => this.removeLayer(object));
    }


    private removeLayer(layer: Map3DLayer) {

        this.viewer.remove(layer.mesh);
        layer.visible = false;
    }


    private async addLayersForDocument(document: IdaiFieldDocument) {

        const Map3DLayerResourceIds = document.resource.relations['has3DRepresentation'];

        if (!Map3DLayerResourceIds || Map3DLayerResourceIds.length == 0) return;

        Map3DLayerResourceIds.forEach(async id => this.addLayerToMap(await this.getLayer(id, document)));
    }


    private async getLayer(id: string, document: IdaiFieldDocument): Promise<Map3DLayer> {

        return this.getObjectMap()[id] || this.loadLayer(id, document);
    }


    private async loadLayer(id: string, document: IdaiFieldDocument): Promise<Map3DLayer> {

        const layer: Map3DLayer = Map3DLayerManager.makeLayer(await this.loader.load(id), document);
        this.layers.push(layer);

        return layer;
    }


    private addLayerToMap(layer: Map3DLayer) {

        layer.visible = true;
        this.viewer.add(layer.mesh);
    }


    private getLayersToRemoveFromMap(newDocuments: Array<IdaiFieldDocument>): Array<Map3DLayer> {

        return this.layers.filter(object => object.visible
            && newDocuments.map(document => document.resource.id).indexOf(object.document.resource.id) == -1);
    }


    private isShownOnMap(document: IdaiFieldDocument): boolean {

        const index: number
            = this.layers.map(object => object.document.resource.id).indexOf(document.resource.id);

        return index > -1 && this.layers[index].visible;
    }


    private getObjectMap(): { [id: string]: Map3DLayer } {

        return this.layers.reduce(
            (map, layer) => { map[layer.document.resource.id as string] = layer; return map; },
                {} as { [id: string]: Map3DLayer }
        );
    }


    private static makeLayer(mesh: THREE.Mesh, document: IdaiFieldDocument): Map3DLayer {

        return {
            mesh: mesh,
            document: document,
            visible: false
        };
    }
}