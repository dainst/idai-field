import {describe, expect, it, fit, xit, inject, injectAsync, beforeEachProviders,
        TestComponentBuilder, ComponentFixture} from 'angular2/testing';
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
    "title": "Title",
    "synced": 0,
    "valid": true,
    "type": "Object"
};

var objectTypeSchema = {
    "fields" : [
        { "field" : "Material" ,
            "valueList" : ["aaa","bbb","ccc"]
        },
        {
            "field" : "oneLiner"
        }
    ]
};

class MockObjectList {

    public getSelectedObject(): IdaiFieldObject {
        return selectedObject;
    }

    public getObjectTypeSchema() {
        return objectTypeSchema;
    };
}


export function main() {
    describe('ObjectEditComponent', () => {

        beforeEachProviders(() => [
            provide('app.dataModelConfig', { useValue: DATA_MODEL_CONFIG }),
            provide(ObjectList, { useClass: MockObjectList }),
            provide(ObjectEditComponent, {useClass: ObjectEditComponent})
        ]);

        it('should do stuff',
            injectAsync([TestComponentBuilder], (tcb: TestComponentBuilder) => {
                return tcb.createAsync(ObjectEditComponent)
                    .then((componentFixture: ComponentFixture) => {
                        componentFixture.detectChanges();
                        const compiled = componentFixture.debugElement.nativeElement;
                        console.log("Element", compiled);
                    });
                }
            )
        ,1000);

    });
}