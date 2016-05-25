import {fdescribe, describe, xdescribe,expect, it, fit, xit,inject, async, beforeEachProviders,
        } from '@angular/core/testing';
import {TestComponentBuilder} from '@angular/compiler/testing';
import {ObjectEditComponent} from '../app/components/object-edit.component'
import {provide, Component} from "@angular/core";
import {ObjectList} from "../app/services/object-list";
import {Datastore} from "../app/datastore/datastore";
import {Project} from "../app/model/project";
import {Messages} from "../app/services/messages";


/**
 * @author Daniel de Oliveira
 * @author Jan G. Wieners
 * @author Sebastian Cuy
 * @author Thomas Kleinke
 */
export function main() {

    describe('ObjectEditComponent', () => {

        class MockDatastore {}
        class MockMessages  {}

        var projectConfiguration = {
            getTypes : function() {
                return ["Section", "Feature", "Lot", "Context", "Object" ];
            },
            getFields : function() {
                return [{
                    "field": "Material",
                    "valuelist": [
                        "Alabaster",
                        "Amber",
                        "Antler"
                    ]
                }];
            }
        };

        var selectedObject = {
            "identifier": "ob1",
            "title": "Title",
            "synced": 0,
            "valid": true,
            "type": "Object"
        };

        var getElementContent = function(fixture, selector: string): string[] {

            var compiled = fixture.debugElement.nativeElement;
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
            provide(Project, { useClass: Project }),
            provide(ObjectEditComponent, {useClass: ObjectEditComponent}),
        ]);


        it('should build without a problem',
            async(inject([TestComponentBuilder], (tcb: TestComponentBuilder) => {
                tcb.createAsync(TestComponent)
                    .then((fixture) => {

                        fixture.componentInstance.selectedObject = selectedObject;
                        fixture.componentInstance.projectConfiguration = projectConfiguration;
                        fixture.detectChanges();

                        expect(getElementContent(fixture, 'label')).toContain('Material');

                        var labels = getElementContent(fixture, 'option');

                        expect(labels).toContain('Alabaster');
                        expect(labels).toContain('Amber');
                        expect(labels).toContain('Antler');
                    });
            }))
        );
    });
}

@Component({
    selector: 'oec',
    template: '<object-edit [(object)]="selectedObject" [(projectConfiguration)]="projectConfiguration"></object-edit>',
    directives: [ObjectEditComponent]
})
class TestComponent {}