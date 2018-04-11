import * as THREE from 'three';
import {Component, Input, OnChanges, SimpleChange, SimpleChanges} from '@angular/core';
import {IdaiFieldDocument} from 'idai-components-2/idai-field-model';
import {Map3DComponent} from '../map-3d.component';
import {MeshGeometryManager} from './mesh-geometry-manager';


@Component({
    moduleId: module.id,
    selector: 'mesh-geometries',
    templateUrl: './mesh-geometries.html'
})
/**
 * @author Thomas Kleinke
 */
export class MeshGeometriesComponent implements OnChanges {

    @Input() documents: Array<IdaiFieldDocument>;
    @Input() selectedDocument: IdaiFieldDocument;
    @Input() hoverDocument: IdaiFieldDocument;
    @Input() meshGeometryManager: MeshGeometryManager;

    public showLineGeometries: boolean = true;
    public showPolygonGeometries: boolean = true;


    constructor(private map3DComponent: Map3DComponent) {}


    async ngOnChanges(changes: SimpleChanges) {

        if (changes['documents']) await this.update();
        if (changes['selectedDocument']) await this.updateSelected(changes['selectedDocument']);
    }


    public getGeometryInfoPosition(): THREE.Vector2|undefined {

        if (!this.hoverDocument) return;

        const mesh: THREE.Mesh|undefined = this.meshGeometryManager.getMesh(this.hoverDocument);
        if (!mesh) return;

        const centerPosition: THREE.Vector3 = mesh.geometry.boundingSphere.center.clone().add(mesh.position);

        return this.map3DComponent.getViewer().getCanvasCoordinates(centerPosition);
    }


    public async toggleLineGeometries() {

        this.showLineGeometries = !this.showLineGeometries;
        await this.update();
    }


    public async togglePolygonGeometries() {

        this.showPolygonGeometries = !this.showPolygonGeometries;
        await this.update();
    }


    private async update() {

        await this.meshGeometryManager.update(
            this.documents ? this.documents : [],
            this.showLineGeometries,
            this.showPolygonGeometries
        );

        if (this.documents) {
            this.map3DComponent.getGeometriesBounds().setMeshes(this.meshGeometryManager.getMeshes());
        }

        this.map3DComponent.getCameraManager().resetPivotPoint();
    }


    private async updateSelected(selecedDocumentChange: SimpleChange) {

        if (selecedDocumentChange.previousValue) {
            await this.meshGeometryManager.updateSelected(selecedDocumentChange.previousValue, false);
        }

        if (selecedDocumentChange.currentValue) {
            await this.meshGeometryManager.updateSelected(selecedDocumentChange.currentValue, true);
        }
    }
}