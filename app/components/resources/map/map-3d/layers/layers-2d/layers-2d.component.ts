import {Component, OnChanges} from '@angular/core';
import {Map3DComponent} from '../../map-3d.component';
import {LayersComponent} from '../layers.component';
import {Layer2DMeshManager} from './layer-2d-mesh-manager';
import {ImageLayerManager} from '../../../map/image-layer-manager';
import {MeshLoadingProgress} from '../../../../../core-3d/mesh-loading-progress';


@Component({
    moduleId: module.id,
    selector: 'layers-2d',
    templateUrl: './layers-2d.html'
})
/**
 * @author Thomas Kleinke
 */
export class Layers2DComponent extends LayersComponent implements OnChanges {

    constructor(map3DComponent: Map3DComponent,
                layerManager: ImageLayerManager,
                layerMeshManager: Layer2DMeshManager,
                meshLoadingProgress: MeshLoadingProgress) {

        super(map3DComponent, layerManager, layerMeshManager, meshLoadingProgress);
    }
}