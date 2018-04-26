import {Injectable} from '@angular/core';
import * as THREE from 'three';
import {MeshLoader} from '../../../../../core-3d/mesh-loading/mesh-loader';
import {LayerMeshManager} from '../layer-mesh-manager';


@Injectable()
/**
 * @author Thomas Kleinke
 */
export class Layer3DMeshManager extends LayerMeshManager {

    constructor(private meshLoader: MeshLoader) {

        super();
    }


    public async getMesh(id: string): Promise<THREE.Mesh> {

        if (!this.meshes[id]) this.meshes[id] = await this.meshLoader.load(id);

        return this.meshes[id];
    }
}