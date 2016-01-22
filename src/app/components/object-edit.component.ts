import {Component} from 'angular2/core';
import {IdaiFieldObject} from "../model/idai-field-object";
import {ModelUtils} from '../model/model-utils';
import {Input} from "angular2/core";
import {Datastore} from "../services/datastore";
import {IdaiFieldBackend} from "../services/idai-field-backend";

/**
 * @author Jan G. Wieners
 */
@Component ({

    selector: 'object-edit',
    templateUrl: 'templates/object-edit.html',
    inputs: ['selectedObject']
})

export class ObjectEditComponent {

    constructor(private datastore: Datastore) {}

    /**
     * Saves the object to the local datastore.
     * @param object
     */
    save(object: IdaiFieldObject) {

        object.synced = false;
        this.datastore.update(object).then(
            () => {},
            err => console.error(err)
        );
    }
}