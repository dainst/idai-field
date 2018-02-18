import * as THREE from 'three';
import {Component, Input, OnChanges, SimpleChanges} from '@angular/core';
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
    @Input() hoverDocument: IdaiFieldDocument;
    @Input() meshGeometryManager: MeshGeometryManager;


    constructor(private map3DComponent: Map3DComponent) {}


    async ngOnChanges(changes: SimpleChanges) {

        if (changes['documents']) await this.meshGeometryManager.update(this.documents);
    }


    public getGeometryInfoPosition(): THREE.Vector2|undefined {

        if (!this.hoverDocument) return;

        const mesh: THREE.Mesh|undefined = this.meshGeometryManager.getMesh(this.hoverDocument);

        if (!mesh) return;

        return this.map3DComponent.getViewer().getScreenCoordinates(mesh.geometry.boundingSphere.center);
    }

}