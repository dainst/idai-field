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

        var errorFunction = function() {
            return {
                then: function(suc,err) {
                    err("databaseError");
                }
            };
        };

        var restoreFunction = function() {
            return {
                then: function(suc,err) {
                    suc(oldVersion);
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
                mockDatastore.refresh.and.callFake(restoreFunction);
        });

        it('should create a non existing object on autosave',
            function() {

                    delete selectedObject.id;
                    objectList.setChanged(selectedObject, true);

                    objectList.trySave(selectedObject);
                    expect((<Datastore> mockDatastore).create).toHaveBeenCalledWith(selectedObject);
                }
        );

        it('should create a non existing object on select change',
            function() {

                    delete selectedObject.id;
                    objectList.setChanged(selectedObject, true);

                    objectList.trySave(selectedObject);
                    expect((<Datastore> mockDatastore).create).toHaveBeenCalledWith(selectedObject);
                }
        );

        it('should update an existing object on autosave',
            function() {

                    objectList.setChanged(selectedObject, true);

                    objectList.trySave(selectedObject);
                    expect((<Datastore> mockDatastore).update).toHaveBeenCalledWith(selectedObject);
                }
        );

        it('should update an existing object on select change',
            function() {

                    objectList.setChanged(selectedObject, true);

                    objectList.trySave(selectedObject);
                    expect((<Datastore> mockDatastore).update).toHaveBeenCalledWith(selectedObject);
                }
        );

        it('should restore an object',
            function(done) {

                expect(objectList.getObjects()[0]).toBe(selectedObject);
                objectList.restoreObject(selectedObject).then(
                    suc => {
                        expect(objectList.getObjects()[0]).toBe(oldVersion);
                        done();
                    },
                    err =>{
                        fail();
                        done();
                    }
                );
            }
        );

        it('should not restore an invalid object on autosave with invalid object',
            function() {

                selectedObject.valid = false;

                expect(objectList.getObjects()[0]).toBe(selectedObject);
                objectList.trySave(selectedObject); // restore the oldVersion now.
                expect(objectList.getObjects()[0]).toBe(selectedObject);
            }
        );

        it('should keep an object marked as changed if it cannot be stored in the database',
            function() {

                mockDatastore.update.and.callFake(errorFunction);
                objectList.setChanged(selectedObject, true);

                objectList.trySave(selectedObject).then(suc=>{},err=>{});
                expect(objectList.isChanged(selectedObject)).toBe(true);
            }
        );

        it('should return a message key in case object cannot get stored',
            function(done) {

                mockDatastore.update.and.callFake(errorFunction);
                objectList.setChanged(selectedObject, true);
                objectList.trySave(selectedObject).then(result=>{
                    fail();
                    done();
                },err=>{
                    expect(err).not.toBe(undefined);
                    done();
                }
                );
            }
        );

        it('should not return a message key in case object can get stored',
            function(done) {

                mockDatastore.update.and.callFake(successFunction);
                objectList.setChanged(selectedObject, true);
                objectList.trySave(selectedObject).then(result=>{
                    expect(result).toBe(undefined);
                    done();
                },err=>{
                    fail();
                    done();
                });
            }
        );
    });
}