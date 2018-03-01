import {Injectable} from '@angular/core';
import * as THREE from 'three';
import {MeshLoader} from '../../../../../core/3d/mesh-loader';


@Injectable()
/**
 * @author Thomas Kleinke
 */
export class Layer3DMeshManager {

    private meshes: { [resourceId: string]: THREE.Mesh } = {};


    constructor(private meshLoader: MeshLoader) {}


    public async getMesh(id: string): Promise<THREE.Mesh> {

        if (!this.meshes[id]) this.meshes[id] = await this.meshLoader.load(id);

        return this.meshes[id];
    }
}