import * as THREE from 'three';
import {SettingsService} from '../settings/settings-service';
import {MeshEditingUtility} from './mesh-editing-utility';

const ColladaLoader = require('three-collada-loader-2');


/**
 * @author Thomas Kleinke
 */
export class MeshLoader {

    constructor(private settingsService: SettingsService) {}


    public load(id: string): Promise<THREE.Mesh> {

        return new Promise((resolve, reject) => {

            const loader = new ColladaLoader();
            loader.load(this.getFilePath(id), (colladaModel: THREE.ColladaModel) => {
                resolve(this.extractAndAdjustMesh(colladaModel));
            });

            // TODO Error handling
        });
    }


    private getFilePath(id: string) {

        return this.settingsService.getSettings().model3DStorePath
            + this.settingsService.getSelectedProject() + '/'
            + id + '/'
            + id + '.dae';
    }


    private extractAndAdjustMesh(colladaModel: THREE.ColladaModel): THREE.Mesh {

        const scene: THREE.Scene = colladaModel.scene;
        const mesh: THREE.Mesh = MeshLoader.getMesh(scene);

        MeshEditingUtility.performDefaultAdjustments(mesh, scene);

        return mesh;
    }


    private static getMesh(scene: THREE.Scene): THREE.Mesh {

        return scene.children.find(object => object instanceof THREE.Mesh) as THREE.Mesh;
    }
}