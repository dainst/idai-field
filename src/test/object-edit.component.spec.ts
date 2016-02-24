import {describe, expect, it, fit, xit, inject, injectAsync, beforeEachProviders,
        TestComponentBuilder, ComponentFixture} from 'angular2/testing';
import {ObjectEditComponent} from '../app/components/object-edit.component'
import {provide, Injectable} from "angular2/core";
import {IdaiFieldObject} from "../app/model/idai-field-object";
import {ObjectList} from "../app/services/object-list";
import {Datastore} from "../app/services/datastore";
import {Messages} from "../app/services/messages";
import {DataModelConfiguration} from "../app/services/data-model-configuration";

/**
 * @author Daniel M. de Oliveira
 * @author Jan G. Wieners
 * @author Sebastian Cuy
 * @author Thomas Kleinke
 */
export function main() {
    describe('ObjectEditComponent', () => {

        class MockDatastore {}
        class MockMessages  {}

        var selectedObject = {
            "identifier": "ob1",
            "title": "Title",
            "synced": 0,
            "valid": true,
            "type": "Object"
        };

        var objectTypeSchema = {
            "types": [
                {
                    "type": "Section"
                },
                {
                    "type": "Feature"
                },
                {
                    "type": "Lot"
                },
                {
                    "type": "Context"
                },
                {
                    "type": "Object",
                    "fields" : [
                        { "field" : "Material" ,
                            "valuelist" : [
                                "Alabaster",
                                "Amber",
                                "Antler"]
                        },
                        {
                            "field" : "oneLiner"
                        }
                    ]
                }
            ]
        };

        beforeEachProviders(() => [
            provide('app.dataModelConfig', { useValue: objectTypeSchema }),
            provide(Datastore, { useClass: MockDatastore }),
            provide(ObjectList, { useClass: ObjectList }),
            provide(Messages, { useClass: MockMessages }),
            provide(DataModelConfiguration, { useClass: DataModelConfiguration}),
            provide(ObjectEditComponent, {useClass: ObjectEditComponent})
        ]);

        it('should contain the specified elements',
            injectAsync([TestComponentBuilder,ObjectList], (tcb: TestComponentBuilder) => {
                return tcb.createAsync(ObjectEditComponent)
                    .then((componentFixture: ComponentFixture) => {
                        componentFixture.componentInstance.object = selectedObject;
                        componentFixture.detectChanges();
                        const compiled = componentFixture.debugElement.nativeElement;

                        var labels = [];
                        var nodeList = compiled.querySelectorAll('label');

                        for(var i = nodeList.length; i--;) {
                            labels.push(nodeList[i].innerHTML);
                        }

                        expect(labels).toContain('Material');

                        labels.length = 0;
                        nodeList = compiled.querySelectorAll('.form-group option');

                        for(var i = nodeList.length; i--;) {
                            labels.push(nodeList[i].innerHTML);
                        }

                        expect(labels).toContain('Alabaster');
                        expect(labels).toContain('Amber');
                        expect(labels).toContain('Antler');
                    });
                }
            )
        ,5000);
    });
}