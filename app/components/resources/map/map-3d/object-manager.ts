import {IdaiFieldDocument} from 'idai-components-2/idai-field-model';
import {Viewer3D} from '../../../../core/3d/viewer-3d';
import {Object3D} from '../../../../core/3d/object-3d';
import {Object3DLoader} from '../../../../core/3d/object-3d-loader';
import {SettingsService} from '../../../../core/settings/settings-service';



/**
 * @author Thomas Kleinke
 */
export class ObjectManager {

    private objects: Array<Object3D> = [];
    private object3DLoader: Object3DLoader;


    constructor(private viewer: Viewer3D,
                private settingsService: SettingsService) {

        this.object3DLoader = new Object3DLoader(settingsService);
    }


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

        this.viewer.remove(object.scene);
        object.visible = false;
    }


    private async add3DObjectsForDocument(document: IdaiFieldDocument) {

        const object3DResourceIds = document.resource.relations['has3DRepresentation'];

        if (!object3DResourceIds || object3DResourceIds.length == 0) return;

        for (let id of object3DResourceIds) {
            this.addObjectToMap(await this.get3DObject(id, document));
        }
    }


    private async get3DObject(id: string, document: IdaiFieldDocument): Promise<Object3D> {

        return this.getObjectMap()[id] || this.load3DObject(id, document);
    }


    private async load3DObject(id: string, document: IdaiFieldDocument): Promise<Object3D> {

        const object: Object3D = await this.object3DLoader.load(id, document);
        this.objects.push(object);

        return object;
    }


    private addObjectToMap(object: Object3D) {

        object.visible = true;
        this.viewer.add(object.scene);
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
}