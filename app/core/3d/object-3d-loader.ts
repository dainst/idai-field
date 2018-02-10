import * as THREE from 'three';
import {IdaiFieldDocument} from 'idai-components-2/idai-field-model';
import {Object3D} from './object-3d';
import {Model3DUtility} from './model-3d-utility';
import {ModelImporter} from './model-importer';
import {SettingsService} from '../settings/settings-service';

const ColladaLoader = require('three-collada-loader-2');


/**
 * @author Thomas Kleinke
 */
export class Object3DLoader {

    constructor(private settingsService: SettingsService) {}


    public async load(id: string, document: IdaiFieldDocument): Promise<Object3D> {

        const scene: THREE.Scene = await this.loadFile(id);

        const object: Object3D = {
            resourceId: id,
            document: document,
            scene: scene,
            mesh: Model3DUtility.getMesh(scene),
            visible: false
        };

        return object;
    }


    private loadFile(id: string): Promise<THREE.Scene> {

        return new Promise((resolve, reject) => {

            const loader = new ColladaLoader();
            loader.load(this.getFilePath(id), (colladaModel: THREE.ColladaModel) => {
                resolve(ModelImporter.importColladaModel(colladaModel));
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
}