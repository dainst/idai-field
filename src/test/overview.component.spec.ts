import {describe, expect, fit, it, xit, beforeEach} from 'angular2/testing';
import {IdaiFieldObject} from "../app/model/idai-field-object";
import {ObjectList} from "../app/services/object-list";
import {OverviewComponent} from "../app/components/overview.component";

/**
 * @author Thomas Kleinke
 */
export function main() {
    describe('OverviewComponent', () => {

        var objects: IdaiFieldObject[];
        var object1 = { "id": "id1", "identifier": "ob1", "title": "Object 1", "synced": 0, "valid": true, "type": "Object" };
        var object2 = { "id": "id2", "identifier": "ob2", "title": "Object 2", "synced": 0, "valid": true, "type": "Object" };

        var overviewComponent: OverviewComponent;
        var mockObjectList: any;

        var validateAndSaveFunction = function() { };
        var getObjectsFunction = function() { return objects; };

        beforeEach(() => {
            mockObjectList = jasmine.createSpyObj('mockObjectList', [ 'validateAndSave', 'getObjects' ]);
            mockObjectList.validateAndSave.and.callFake(validateAndSaveFunction);
            mockObjectList.getObjects.and.callFake(getObjectsFunction);

            overviewComponent = new OverviewComponent(null, {}, mockObjectList);

            objects = [object1, object2];
        });

        it('should save the currently selected object if another object is selected',
            function() {
                overviewComponent.onSelect(object1);
                overviewComponent.onSelect(object2);

                expect((<ObjectList> mockObjectList).validateAndSave).toHaveBeenCalledWith(object1, true);
                expect((<ObjectList> mockObjectList).validateAndSave).not.toHaveBeenCalledWith(object2, true);
            }
        );

        it('should save the currently selected object if a new object is created',
            function() {
                overviewComponent.onSelect(object1);
                overviewComponent.onCreate();

                expect((<ObjectList> mockObjectList).validateAndSave).toHaveBeenCalledWith(object1, true);
            }
        );

        it('should add an empty object to the top of the object list if a new object is created',
            function() {
                overviewComponent.onCreate();

                expect(objects.length).toBe(3);
                expect(objects[0]).toEqual({});
                expect(objects[1]).toBe(object1);
                expect(objects[2]).toBe(object2);
            }
        );

        it('should remove a newly created object from the object list if it does not have an id and another object is' +
            'selected',
            function() {
                overviewComponent.onCreate();
                overviewComponent.onSelect(object1);

                expect(objects.length).toBe(2);
                expect(objects[0]).toBe(object1);
                expect(objects[1]).toBe(object2);
            }
        );

        it('should not remove a newly created object from the object list if it has an id and another object is' +
            'selected',
            function() {
                overviewComponent.onCreate();
                objects[0].id = "id";
                overviewComponent.onSelect(object1);

                expect(objects.length).toBe(3);
                expect(objects[0]).toEqual({ id: "id" });
                expect(objects[1]).toBe(object1);
                expect(objects[2]).toBe(object2);
            }
        );

        it('should remove a newly created object from the object list if it does not have an id and a new object is' +
            'created',
            function() {
                overviewComponent.onCreate();
                overviewComponent.onCreate();

                expect(objects.length).toBe(3);
                expect(objects[0]).toEqual({});
                expect(objects[1]).toBe(object1);
                expect(objects[2]).toBe(object2);
            }
        );

        it('should not remove a newly created object from the object list if it has an id and a new object is created',
            function() {
                overviewComponent.onCreate();
                objects[0].id = "id";
                overviewComponent.onCreate();

                expect(objects.length).toBe(4);
                expect(objects[0]).toEqual({});
                expect(objects[1]).toEqual({ id: "id" });
                expect(objects[2]).toBe(object1);
                expect(objects[3]).toBe(object2);
            }
        );

    });
}