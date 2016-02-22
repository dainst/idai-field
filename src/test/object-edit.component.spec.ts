import {describe, expect, it, fit, xit, inject, beforeEachProviders} from 'angular2/testing';
import {ObjectEditComponent} from '../app/components/object-edit.component'
import {provide, Injectable} from "angular2/core";
import {IdaiFieldObject} from "../app/model/idai-field-object";
import {ObjectList} from "../app/services/object-list";
import {DATA_MODEL_CONFIG} from "../app/Configuration";

/**
 * @author Daniel M. de Oliveira
 * @author Jan G. Wieners
 * @author Sebastian Cuy
 * @author Thomas Kleinke
 */

var selectedObject = {
    "identifier": "ob1",
    "title": "Test",
    "synced": 0,
    "valid": true,
    "type": "Object"
};

class MockObjectList {

    public getSelectedObject(): IdaiFieldObject {

        return selectedObject;
    }
}


export function main() {
    describe('ObjectEditComponent', () => {

        beforeEachProviders(() => [
            provide('app.dataModelConfig', { useValue: DATA_MODEL_CONFIG }),
            provide(ObjectList, { useClass: MockObjectList }),
            provide(ObjectEditComponent, {useClass: ObjectEditComponent})
        ]);

        it('should do some basic stuff',
            inject([ObjectEditComponent],
                (objectEditComponent: ObjectEditComponent) => {
                    expect(objectEditComponent.test()).toBe(selectedObject);
                }
            )
        );
    });
}