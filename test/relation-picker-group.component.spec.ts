import {describe,xdescribe, expect, fit, it, xit, beforeEach} from '@angular/core/testing';
import {Entity} from "../app/core-services/entity";
import {RelationPickerGroupComponent} from "../app/object-edit/relation-picker-group.component";

/**
 * @author Thomas Kleinke
 */
export function main() {
    describe('RelationPickerGroupComponent', () => {

        var object: Entity;
        var relationPickerGroupComponent: RelationPickerGroupComponent;

        beforeEach(() => {
            object = { "id": "id1", "identifier": "ob1", "title": "Object 1", "type": "Object" };

            relationPickerGroupComponent = new RelationPickerGroupComponent();
            relationPickerGroupComponent.object = object;
            relationPickerGroupComponent.field = { "field": "Above", "inverse": "Below" };
        });

        it('should create an empty relation array if no relation array exists and a new relation is created',
            function() {
                relationPickerGroupComponent.createRelation();

                expect(object["Above"].length).toBe(1);
                expect(object["Above"][0]).toBe("");
            }
        );
    });

}