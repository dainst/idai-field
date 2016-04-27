import {describe, expect, it, fit, xit, inject, injectAsync, beforeEachProviders,
        TestComponentBuilder, ComponentFixture} from 'angular2/testing';
import {ObjectEditComponent} from '../../main/app/components/object-edit.component'
import {provide, Injectable} from "angular2/core";
import {IdaiFieldObject} from "../../main/app/model/idai-field-object";
import {ObjectList} from "../../main/app/services/object-list";
import {Datastore} from "../../main/app/datastore/datastore";
import {Messages} from "../../main/app/services/messages";
import {DataModelConfiguration} from "../../main/app/services/data-model-configuration";

//import 'zone.js/dist/zone';


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

        class MockDataModelConfiguration {
            public getTypes = function() {
                return ["Section", "Feature", "Lot", "Context", "Object" ];
            };
            public getFields = function() {
                return [{
                    "field": "Material",
                    "valuelist": [
                        "Alabaster",
                        "Amber",
                        "Antler"
                    ]
                }];
            }
        }

        var selectedObject = {
            "identifier": "ob1",
            "title": "Title",
            "synced": 0,
            "valid": true,
            "type": "Object"
        };

        var getElementContent = function(componentFixture, selector: string): string[] {

            componentFixture.componentInstance.object = selectedObject;
            componentFixture.componentInstance.dataModelConfiguration = new MockDataModelConfiguration();
            componentFixture.detectChanges();

            var compiled = componentFixture.debugElement.nativeElement;
            var labels = [];
            var nodeList = compiled.querySelectorAll(selector);

            for(var i = nodeList.length; i--;) {
                labels.push(nodeList[i].innerHTML);
            }

            return labels;
        };



        beforeEachProviders(() => [
            provide(Datastore, { useClass: MockDatastore }),
            provide(ObjectList, { useClass: ObjectList }),
            provide(Messages, { useClass: MockMessages }),
            provide(DataModelConfiguration, { useClass: MockDataModelConfiguration}),
            provide(ObjectEditComponent, {useClass: ObjectEditComponent}),
            provide(TestComponentBuilder, {useClass: TestComponentBuilder}),
        ]);

        it('should contain the specified elements',
            injectAsync([TestComponentBuilder,ObjectList], (tcb: TestComponentBuilder) => {
                return tcb.createAsync(ObjectEditComponent)
                    .then((componentFixture: ComponentFixture) => {

                        var labels;
                        labels = getElementContent(componentFixture, 'label');

                        expect(labels).toContain('Material');

                        // labels = getElementContent(componentFixture, 'option');
                        //
                        // expect(labels).toContain('Alabaster');
                        // expect(labels).toContain('Amber');
                        // expect(labels).toContain('Antler');
                    });
                }
            )
        ,5000);
    });
}