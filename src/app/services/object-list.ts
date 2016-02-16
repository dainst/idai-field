import {Injectable} from "angular2/core";

import {IdaiFieldObject} from "../model/idai-field-object";

/**
 * @author Thomas Kleinke
 * @author Daniel M. de Oliveira
 * @author Jan G. Wieners
 */
@Injectable()

export class ObjectList {

    /**
     * The Object currently selected in the list and shown in the edit component.
     */
    private selectedObject: IdaiFieldObject;
    /**
     * The object under creation which has not been yet put to the list permanently.
     * As soon as it is validated successfully newObject is set to "undefined" again.
     */
    private newObject: any;
    private objects: IdaiFieldObject[];

    public getObjects() {
        return this.objects;
    }

    public setObjects(objects: IdaiFieldObject[]) {
        this.objects = objects;
    }

    public getNewObject() {
        return this.newObject;
    }

    public setNewObject(object: any) {
        this.newObject = object;
    }

    public getSelectedObject() {
        return this.selectedObject;
    }

    public setSelectedObject(object: IdaiFieldObject) {
        this.selectedObject = object;
    }


}