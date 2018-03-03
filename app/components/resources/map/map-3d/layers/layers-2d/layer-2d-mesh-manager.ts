import {Injectable} from '@angular/core';
import * as THREE from 'three';
import {LayerMeshManager} from '../layer-mesh-manager';
import {Layer2DMeshBuilder} from './layer-2d-mesh-builder';


@Injectable()
/**
 * @author Thomas Kleinke
 */
export class Layer2DMeshManager extends LayerMeshManager {

    private meshes: { [resourceId: string]: THREE.Mesh } = {};


    constructor(private meshBuilder: Layer2DMeshBuilder) {

        super();
    }


    public async getMesh(imageResourceId: string): Promise<THREE.Mesh> {

        if (!this.meshes[imageResourceId]) {
            this.meshes[imageResourceId] = await this.meshBuilder.build(imageResourceId);
        }

        return this.meshes[imageResourceId];
    }
}