import * as THREE from 'three';
import {Component, Input, OnChanges, SimpleChange, SimpleChanges} from '@angular/core';
import {IdaiFieldDocument} from 'idai-components-2';
import {Map3DComponent} from '../../map-3d.component';


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

    public showLineGeometries: boolean = true;
    public showPolygonGeometries: boolean = true;


    constructor(private map3DComponent: Map3DComponent) {}


    async ngOnChanges(changes: SimpleChanges) {

        if (changes['documents']) await this.update();
        if (changes['selectedDocument']) await this.updateSelected(changes['selectedDocument']);
    }


    public getGeometryInfoPosition(): THREE.Vector2|undefined {

        if (!this.hoverDocument) return;

        const mesh: THREE.Mesh|undefined
            = this.map3DComponent.getMeshGeometryManager().getMesh(this.hoverDocument);
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

        await this.map3DComponent.getMeshGeometryManager().update(
            this.documents ? this.documents : [],
            this.showLineGeometries,
            this.showPolygonGeometries
        );

        if (this.documents) {
            this.map3DComponent.getGeometriesBounds().setMeshes(
                this.map3DComponent.getMeshGeometryManager().getMeshes()
            );
        }

        this.map3DComponent.getCameraManager().resetPivotPoint();
    }


    private updateSelected(selecedDocumentChange: SimpleChange) {

        if (selecedDocumentChange.previousValue) {
            this.map3DComponent.getMeshGeometryManager().updateSelected(
                selecedDocumentChange.previousValue,
                false
            );
        }

        if (selecedDocumentChange.currentValue) {
            this.map3DComponent.getMeshGeometryManager().updateSelected(
                selecedDocumentChange.currentValue,
                true
            );
        }
    }
}