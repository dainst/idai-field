import {describe, expect, fit, it, xit, beforeEach} from 'angular2/testing';
import {IdaiFieldObject} from "../app/model/idai-field-object";
import {Datastore} from "../app/datastore/datastore";
import {RelationPickerGroupComponent} from "../app/components/relation-picker-group.component";

/**
 * @author Thomas Kleinke
 */
export function main() {
    describe('RelationPickerGroupComponent', () => {

        var object1: IdaiFieldObject;
        var object2: IdaiFieldObject;

        var relationPickerGroupComponent: RelationPickerGroupComponent;
        var mockDatastore: any;
        var mockParent: any;

        var get = function() {
            return {
                then: function(suc) {
                    suc(object2);
                    return {
                        catch: function() {}
                    }
                }
            };
        };

        beforeEach(() => {
            object1 = { "id": "id1", "identifier": "ob1", "title": "Object 1", "synced": 0, "valid": true,
                "type": "Object" };

            object2 = { "id": "id2", "identifier": "ob2", "title": "Object 2", "synced": 0, "valid": true,
                "type": "Object" };

            mockDatastore = jasmine.createSpyObj('mockDatastore', [ 'get' ]);
            mockDatastore.get.and.callFake(get);

            mockParent = jasmine.createSpyObj('mockParent', [ 'save' ]);

            relationPickerGroupComponent = new RelationPickerGroupComponent(mockDatastore);
            relationPickerGroupComponent.object = object1;
            relationPickerGroupComponent.field = { "field": "Above", "inverse": "Below" };
            relationPickerGroupComponent.parent = mockParent;
        });

        it('should create an empty relation array if no relation array exists and a new relation is created',
            function() {
                relationPickerGroupComponent.createRelation();

                expect(object1["Above"].length).toBe(1);
                expect(object1["Above"][0]).toBe("");
            }
        );

        it('should delete a relation and its corresponding inverse relation',
            function(done) {
                object1["Above"] = [ "id2" ];
                object2["Below"] = [ "id1" ];

                relationPickerGroupComponent.deleteRelation(0).then(
                    () => {
                        expect(object1["Above"].length).toBe(0);
                        expect(object1.changed).toBe(true);

                        expect(object2["Below"].length).toBe(0);
                        expect(object2.changed).toBe(true);

                        expect(mockParent.save).toHaveBeenCalled();

                        done();
                    },
                    err => {
                        fail(err);
                        done();
                    }
                );
            }
        );
    });

}