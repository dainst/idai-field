import {Injectable} from '@angular/core';
import * as THREE from 'three';
import {Viewer3D} from '../../../../../core/3d/viewer-3d';
import {MeshLoader} from '../../../../../core/3d/mesh-loader';


@Injectable()
/**
 * @author Thomas Kleinke
 */
export class Layer3DMeshManager {

    private meshes: { [resourceId: string]: THREE.Mesh } = {};
    private viewer: Viewer3D;


    constructor(private meshLoader: MeshLoader) {}


    public setViewer(viewer: Viewer3D) {

        this.viewer = viewer;
    }


    public getMesh(id: string): THREE.Mesh|undefined {

        return this.meshes[id];
    }


    public async addMesh(id: string) {

        if (!this.meshes[id]) this.meshes[id] = await this.meshLoader.load(id);

        this.viewer.add(this.meshes[id]);
    }


    public removeMesh(id: string) {

        this.viewer.remove(this.meshes[id]);
    }
}