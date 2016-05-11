import {describe, expect, it, fit, xit, inject, injectAsync, beforeEachProviders,
        } from '@angular/core/testing';
import {TestComponentBuilder, ComponentFixture} from '@angular/compiler/testing';
import {ObjectEditComponent} from '../app/components/object-edit.component'
import {provide, Injectable} from "@angular/core";
import {IdaiFieldObject} from "../app/model/idai-field-object";
import {ObjectList} from "../app/services/object-list";
import {Datastore} from "../app/datastore/datastore";
import {Messages} from "../app/services/messages";
import {ProjectConfiguration} from "../app/model/project-configuration";

//import 'zone.js/dist/zone';


/**
 * @author Daniel M. de Oliveira
 * @author Jan G. Wieners
 * @author Sebastian Cuy
 * @author Thomas Kleinke
 */
export function main() {
    // TODO exclude this as long as the template loading problem isn't solved within the new build process
    xdescribe('ObjectEditComponent', () => {

        class MockDatastore {}
        class MockMessages  {}

        class MockProjectConfiguration {
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
            componentFixture.componentInstance.projectConfiguration = new MockProjectConfiguration();
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
            provide(ProjectConfiguration, { useClass: MockProjectConfiguration}),
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