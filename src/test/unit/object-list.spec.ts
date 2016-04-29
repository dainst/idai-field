import {describe,expect,fit,it,xit, inject, beforeEach,beforeEachProviders} from 'angular2/testing';
import {provide} from "angular2/core";
import {IdaiFieldObject} from "../../main/app/model/idai-field-object";
import {ObjectList} from "../../main/app/services/object-list";
import {Datastore} from "../../main/app/datastore/datastore";
import {Messages} from "../../main/app/services/messages";
import {M} from "../../main/app/m";

/**
 * @author Daniel M. de Oliveira
 * @author Thomas Kleinke
 */
export function main() {
    describe('ObjectList', () => {

        beforeEachProviders(() => [
            provide(Messages, {useClass: Messages}),
            provide(M, {useClass: M})
        ]);

        var mockDatastore;
        var objectList;
        var id = "abc";

        var oldVersion : IdaiFieldObject = { "identifier": "ob4", "title": "Luke Skywalker (old)", "synced": 0,
            "valid": true, "type": "Object" };
        var selectedObject : IdaiFieldObject;

        var successFunction = function() {
            return {
                then: function(suc,err) {
                    suc("ok");
                }
            };
        };

        var errorFunction =function() {
            return {
                then: function(suc,err) {
                    err("databaseError");
                }
            };
        };

        beforeEach(function() {

                mockDatastore   = jasmine.createSpyObj('mockDatastore', [ 'create','update','refresh' ]);
                objectList = new ObjectList(mockDatastore);

                selectedObject = { "identifier": "ob4", "title": "Luke Skywalker", "synced": 0, "valid": true ,
                    "id" : id, "type": "Object" };
                objectList.setObjects([selectedObject]);

                mockDatastore.create.and.callFake(successFunction);
                mockDatastore.update.and.callFake(successFunction);
                mockDatastore.refresh.and.callFake(function() {
                    return {
                        then: function(suc,err) {
                            suc(oldVersion);
                        }
                    };
                });
        });

        it('should create a non existing object on autosave',
            function() {

                    delete selectedObject.id;
                    selectedObject.changed = true;

                    objectList.validateAndSave(selectedObject, false, true);
                    expect((<Datastore> mockDatastore).create).toHaveBeenCalledWith(selectedObject);
                }
        );

        it('should create a non existing object on select change',
            function() {

                    delete selectedObject.id;
                    selectedObject.changed = true;

                    objectList.validateAndSave(selectedObject, true, true);
                    expect((<Datastore> mockDatastore).create).toHaveBeenCalledWith(selectedObject);
                }
        );

        it('should update an existing object on autosave',
            function() {

                    selectedObject.changed = true;

                    objectList.validateAndSave(selectedObject, false);
                    expect((<Datastore> mockDatastore).update).toHaveBeenCalledWith(selectedObject);
                }
        );

        it('should update an existing object on select change',
            function() {

                    selectedObject.changed = true;

                    objectList.validateAndSave(selectedObject, true);
                    expect((<Datastore> mockDatastore).update).toHaveBeenCalledWith(selectedObject);
                }
        );

        it('should restore a non valid object on select change with unsaved changes',
            function() {

                    mockDatastore.update.and.callFake(errorFunction);
                    selectedObject.changed = true;

                    expect(objectList.getObjects()[0]).toBe(selectedObject);
                    objectList.validateAndSave(selectedObject, true).then(suc=>{},err=>{}) // restore the oldVersion now.
                    expect(objectList.getObjects()[0]).toBe(oldVersion);
                }
        );

        it('should not restore a non valid object on autosave with unsaved changes',
            function() {

                mockDatastore.update.and.callFake(errorFunction);
                selectedObject.changed = true;

                expect(objectList.getObjects()[0]).toBe(selectedObject)
                objectList.validateAndSave(selectedObject, false).then(suc=>{},err=>{}) // do not restore the oldVersion now.
                expect(objectList.getObjects()[0]).toBe(selectedObject)
            }
        );

        it('should restore an invalid object on select change with invalid object',
            function() {

                mockDatastore.update.and.callFake(errorFunction);
                selectedObject.changed = true

                expect(objectList.getObjects()[0]).toBe(selectedObject)
                objectList.validateAndSave(selectedObject, true).then(suc=>{},err=>{}) // restore the oldVersion now.
                expect(objectList.getObjects()[0]).toBe(oldVersion)
            }
        );

        it('should not restore an invalid object on autosave with invalid object',
            function() {

                selectedObject.valid = false;

                expect(objectList.getObjects()[0]).toBe(selectedObject);
                objectList.validateAndSave(selectedObject, false, true); // restore the oldVersion now.
                expect(objectList.getObjects()[0]).toBe(selectedObject);
            }
        );

        it('should mark an object invalid if it cannot be stored in the database',
            function() {

                    mockDatastore.update.and.callFake(errorFunction);
                    selectedObject.changed = true;

                    expect(selectedObject.changed).toBe(true);
                    objectList.validateAndSave(selectedObject, false, true).then(suc=>{},err=>{});
                    expect(selectedObject.changed).toBe(true);
                }
        );

        it('should return a message key in case object cannot get stored',
            function(done) {

                mockDatastore.update.and.callFake(errorFunction);
                selectedObject.changed = true;
                objectList.validateAndSave(selectedObject, false).then(result=>{
                    fail()
                    done()
                },err=>{
                    expect(err).not.toBe(undefined)
                    done()
                }
                );
            }
        );

        it('should not return a message key in case object can get stored',
            function(done) {

                mockDatastore.update.and.callFake(successFunction);
                selectedObject.changed = true;
                objectList.validateAndSave(selectedObject, true).then(result=>{
                    expect(result).toBe(undefined)
                    done()
                },err=>{
                    fail()
                    done()
                });
            }
        );
    });
}