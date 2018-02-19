import * as THREE from 'three';
import {SettingsService} from '../settings/settings-service';
import {MeshEditingUtility} from './mesh-editing-utility';
import {MeshLoadingProgress} from '../../components/core-3d/mesh-loading-progress';

const ColladaLoader = require('three-collada-loader-2');


/**
 * @author Thomas Kleinke
 */
export class MeshLoader {

    private meshEditingUtility: MeshEditingUtility;


    constructor(private settingsService: SettingsService,
                private loadingProgress: MeshLoadingProgress) {

        this.meshEditingUtility = new MeshEditingUtility(loadingProgress);
    }


    public load(id: string): Promise<THREE.Mesh> {

        return new Promise((resolve, reject) => {

            this.loadingProgress.reset();

            const loader = new ColladaLoader();

            loader.load(this.getFilePath(id),
                async (colladaModel: THREE.ColladaModel) => {
                    resolve(this.extractMesh(colladaModel, id));
                },
                (event: ProgressEvent) => {
                    this.loadingProgress.setLoadingProgress(id, event.loaded, event.total);
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


    private async extractMesh(colladaModel: THREE.ColladaModel, id: string): Promise<THREE.Mesh> {

        const scene: THREE.Scene = colladaModel.scene;

        const mesh: THREE.Mesh = MeshLoader.getMesh(scene);
        mesh.name = id;

        await this.meshEditingUtility.performDefaultAdjustments(mesh, scene);

        return mesh;
    }


    private static getMesh(scene: THREE.Scene): THREE.Mesh {

        return scene.children.find(object => object instanceof THREE.Mesh) as THREE.Mesh;
    }
}