import {Component, OnChanges} from '@angular/core';
import {Layer3DManager} from './layer-3d-manager';
import {Layer3DMeshManager} from './layer-3d-mesh-manager';
import {Map3DComponent} from '../../map-3d.component';
import {LayersComponent} from '../layers.component';
import {MeshLoadingProgress} from '../../../../../core-3d/mesh-loading-progress';


@Component({
    moduleId: module.id,
    selector: 'layers-3d',
    templateUrl: './layers-3d.html'
})
/**
 * @author Thomas Kleinke
 */
export class Layers3DComponent extends LayersComponent implements OnChanges {

    constructor(map3DComponent: Map3DComponent,
                layerManager: Layer3DManager,
                layerMeshManager: Layer3DMeshManager,
                meshLoadingProgress: MeshLoadingProgress) {

        super(map3DComponent, layerManager, layerMeshManager, meshLoadingProgress);
    }
}