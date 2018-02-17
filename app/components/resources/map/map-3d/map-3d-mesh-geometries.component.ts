import * as THREE from 'three';
import {Component, Input, OnChanges, SimpleChanges} from '@angular/core';
import {IdaiFieldDocument} from 'idai-components-2/idai-field-model';
import {Map3DComponent} from './map-3d.component';
import {Map3DMeshGeometryManager} from './map-3d-mesh-geometry-manager';


@Component({
    moduleId: module.id,
    selector: 'map-3d-mesh-geometries',
    templateUrl: './map-3d-mesh-geometries.html'
})
/**
 * @author Thomas Kleinke
 */
export class Map3DMeshGeometriesComponent implements OnChanges {

    @Input() documents: Array<IdaiFieldDocument>;
    @Input() hoverDocument: IdaiFieldDocument;
    @Input() meshGeometryManager: Map3DMeshGeometryManager;


    constructor(private map3DComponent: Map3DComponent) {}


    async ngOnChanges(changes: SimpleChanges) {

        if (changes['documents']) await this.meshGeometryManager.update(this.documents);
    }


    public getLineInfoPosition(): THREE.Vector2|undefined {

        if (!this.hoverDocument) return;

        const mesh: THREE.Mesh|undefined = this.meshGeometryManager.getMesh(this.hoverDocument);

        if (!mesh) return;

        return this.map3DComponent.getViewer().getScreenCoordinates(mesh.geometry.boundingSphere.center);
    }

}