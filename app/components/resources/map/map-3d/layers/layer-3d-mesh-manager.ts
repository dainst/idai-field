import * as THREE from 'three';
import {Viewer3D} from '../../../../../core/3d/viewer-3d';
import {MeshLoader} from '../../../../../core/3d/mesh-loader';
import {SettingsService} from '../../../../../core/settings/settings-service';
import {MeshLoadingProgress} from '../../../../core-3d/mesh-loading-progress';


/**
 * @author Thomas Kleinke
 */
export class Layer3DMeshManager {

    private meshes: { [resourceId: string]: THREE.Mesh } = {};
    private loader: MeshLoader;


    constructor(private viewer: Viewer3D,
                settingsService: SettingsService,
                meshLoadingProgress: MeshLoadingProgress) {

        this.loader = new MeshLoader(settingsService, meshLoadingProgress);
    }


    public getMesh(id: string): THREE.Mesh|undefined {

        return this.meshes[id];
    }


    public async addMesh(id: string) {

        if (!this.meshes[id]) this.meshes[id] = await this.loader.load(id);

        this.viewer.add(this.meshes[id]);
    }


    public removeMesh(id: string) {

        this.viewer.remove(this.meshes[id]);
    }
}