import {Injectable} from '@angular/core';
import * as THREE from 'three';
import {SettingsService} from '../../../core/settings/settings-service';
import {MeshPreparationUtility} from './mesh-preparation-utility';
import {MeshLoadingProgress} from './mesh-loading-progress';

const ColladaLoader = require('three-collada-loader');


@Injectable()
/**
 * @author Thomas Kleinke
 */
export class MeshLoader {

    constructor(private settingsService: SettingsService,
                private loadingProgress: MeshLoadingProgress,
                private meshEditingUtility: MeshPreparationUtility) {}


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
                },
                (err: any) => {
                    console.error('Failed to load file ' + id);
                    reject(err);
                });
        });
    }


    private getFilePath(id: string) {

        return this.settingsService.getSettings().model3DStorePath
            + this.settingsService.getSelectedProject() + '/'
            + id + '/' + id;
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