import {describe, expect, fit, it, xit, beforeEach} from 'angular2/testing';
import {IdaiFieldObject} from "../../main/app/model/idai-field-object";
import {ObjectList} from "../../main/app/services/object-list";
import {OverviewComponent} from "../../main/app/components/overview.component";
import {Datastore} from "../../main/app/datastore/datastore";

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
        var mockDatastore: any;

        var getObjects = function() { return objects; };
        var setObjects = function(newObjects: IdaiFieldObject[]) { objects = newObjects; };

        var validateAndSave = function() {
            return {
                then: function(suc,err) {
                    err("err");
                }
            };
        };

        var all = function() {
            return {
                then: function(suc) {
                    suc([object1, object2]);
                    return {
                        catch: function() {}
                    }
                }
            };
        };

        var find = function() {
            return {
                then: function(suc) {
                    suc([object1]);
                    return {
                        catch: function() {}
                    }
                }
            };
        };


        beforeEach(() => {
            mockObjectList = jasmine.createSpyObj('mockObjectList', [ 'validateAndSave', 'getObjects', 'setObjects' ]);
            mockObjectList.validateAndSave.and.callFake(validateAndSave);
            mockObjectList.getObjects.and.callFake(getObjects);
            mockObjectList.setObjects.and.callFake(setObjects);

            mockDatastore = jasmine.createSpyObj('mockDatastore', [ 'all', 'find' ]);
            mockDatastore.all.and.callFake(all);
            mockDatastore.find.and.callFake(find);

            var mockMessages = jasmine.createSpyObj('messages', [ 'add', 'delete' ]);

            overviewComponent = new OverviewComponent(mockDatastore, {}, mockObjectList,undefined, mockMessages);

            objects = [object1, object2];
        });

        it('should save the currently selected object if another object is selected',
            function() {
                overviewComponent.onSelect(object1);
                overviewComponent.onSelect(object2);

                expect((<ObjectList> mockObjectList).trySave).toHaveBeenCalledWith(object1, true);
                expect((<ObjectList> mockObjectList).trySave).not.toHaveBeenCalledWith(object2, true);
            }
        );

        it('should save the currently selected object if a new object is created',
            function() {
                overviewComponent.onSelect(object1);
                overviewComponent.onCreate();

                expect((<ObjectList> mockObjectList).trySave).toHaveBeenCalledWith(object1, true);
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

        it('should show all objects if the search field is empty',
            function() {
                objects = [];
                overviewComponent.onKey({ target: { value: "" } });

                expect((<Datastore> mockDatastore).all).toHaveBeenCalledWith({});
                expect(objects.length).toBe(2);
                expect(objects[0]).toBe(object1);
                expect(objects[1]).toBe(object2);
            }
        );

        it('should search for objects if the search field is not empty',
            function() {
                var searchString = "Search string";
                overviewComponent.onKey({ target: { value: searchString } });

                expect((<Datastore> mockDatastore).find).toHaveBeenCalledWith(searchString, {});
                expect(objects.length).toBe(1);
                expect(objects[0]).toBe(object1);
            }
        );

    });
}