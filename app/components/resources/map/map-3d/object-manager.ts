import * as THREE from 'three';
import {IdaiFieldDocument} from 'idai-components-2/idai-field-model';
import {Map3D} from './map-3d';
import {Object3D} from './object-3d';
import {ModelImporter} from './model-importer';
import {Model3DUtility} from './model-3d-utility';
import {SettingsService} from '../../../../core/settings/settings-service';

const ColladaLoader = require('three-collada-loader-2');


/**
 * @author Thomas Kleinke
 */
export class ObjectManager {

    private objects: Array<Object3D> = [];


    constructor(private map: Map3D,
                private settingsService: SettingsService) {}


    public async show3DObjectsForDocuments(documents: Array<IdaiFieldDocument>) {

        if (!documents) return;

        this.remove3DObjects(this.getObjectsToRemoveFromMap(documents));
        await this.add3DObjectsForDocuments(documents);
    }


    public get3DObjectByDocumentResourceId(resourceId: string): Object3D|undefined {

        return this.objects.find(object => object.document.resource.id == resourceId);
    }


    public get3DObjectByModelId(meshId: string): Object3D|undefined {

        return this.objects.find(object => object.mesh.uuid == meshId);
    }


    private async add3DObjectsForDocuments(documents: Array<IdaiFieldDocument>) {

        for (let document of documents) {
            if (!this.isShownOnMap(document)) await this.add3DObjectsForDocument(document);
        }
    }


    private remove3DObjects(objects: Array<Object3D>) {

        for (let object of objects) {
            this.remove3DObject(object);
        }
    }


    private remove3DObject(object: Object3D) {

        this.map.remove(object.scene);
        object.visible = false;
    }


    private async add3DObjectsForDocument(document: IdaiFieldDocument) {

        const object3DResourceIds = document.resource.relations['has3DRepresentation'];

        if (!object3DResourceIds || object3DResourceIds.length == 0) return;

        for (let id of object3DResourceIds) {
            const object: Object3D = await this.get3DObject(id, document);
            this.addObjectToMap(object);
        }
    }


    private async get3DObject(id: string, document: IdaiFieldDocument): Promise<Object3D> {

        let object: Object3D|undefined = this.getObjectMap()[id];

        if (!object) object = await this.load3DObject(id, document);

        return object;
    }


    private async load3DObject(id: string, document: IdaiFieldDocument): Promise<Object3D> {

        const scene: THREE.Scene = await this.loadFile(id);

        const object: Object3D = {
            resourceId: id,
            document: document,
            scene: scene,
            mesh: Model3DUtility.getMesh(scene),
            visible: false
        };

        this.objects.push(object);

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


    private addObjectToMap(object: Object3D) {

        object.visible = true;
        this.map.add(object.scene);
    }


    private getObjectsToRemoveFromMap(newDocuments: Array<IdaiFieldDocument>): Array<Object3D> {

        return this.objects.filter(object => object.visible
            && newDocuments.map(document => document.resource.id).indexOf(object.document.resource.id) == -1);
    }


    private isShownOnMap(document: IdaiFieldDocument): boolean {

        const index: number
            = this.objects.map(object => object.document.resource.id).indexOf(document.resource.id);

        if (index == -1 || !this.objects[index].visible) return false;

        return true;
    }


    private getObjectMap(): { [id: string]: Object3D } {

        return this.objects.reduce(
            (map, object) => { map[object.resourceId] = object; return map; }, {} as { [id: string]: Object3D }
        );
    }


    private getFilePath(id: string) {

        return this.settingsService.getSettings().model3DStorePath
            + this.settingsService.getSelectedProject() + '/'
            + id + '/'
            + id + '.dae';
    }
}