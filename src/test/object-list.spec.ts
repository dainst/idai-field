import {describe,expect,fit,it,xit, inject, beforeEach,beforeEachProviders} from 'angular2/testing';
import {provide} from "angular2/core";
import {IdaiFieldObject} from "../app/model/idai-field-object";
import {ObjectList} from "../app/services/object-list";
import {Datastore} from "../app/datastore/datastore";
import {Messages} from "../app/services/messages";

/**
 * @author Daniel M. de Oliveira
 * @author Thomas Kleinke
 */
export function main() {
    describe('ObjectList', () => {

        beforeEachProviders(() => [
            provide(Messages, {useClass: Messages})
        ]);

        var mockDatastore;
        var messagesService;
        var objectList;
        var id = "abc";

        var oldVersion : IdaiFieldObject = {"identifier": "ob4", "title": "Luke Skywalker (old)", "synced": 0,
            "valid": true, "type": "Object","relations": [] };
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

        beforeEach(
            inject([Messages],
            (messages:Messages) => {

                messagesService = messages;

                mockDatastore   = jasmine.createSpyObj('mockDatastore', [ 'create','update','refresh' ]);
                objectList = new ObjectList(mockDatastore, messages, undefined);

                selectedObject = { "identifier": "ob4", "title": "Luke Skywalker", "synced": 0, "valid": true ,
                    "id" : id, "type": "Object", "relations": [] };
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
        }));

        it('should create a non existing object on autosave',
            function() {

                    delete selectedObject.id;
                    objectList.setChanged();

                    objectList.validateAndSave(selectedObject, false);
                    expect((<Datastore> mockDatastore).create).toHaveBeenCalledWith(selectedObject);
                }
        );

        it('should create a non existing object on select change',
            function() {

                    delete selectedObject.id;
                    objectList.setChanged();

                    objectList.validateAndSave(selectedObject, true);
                    expect((<Datastore> mockDatastore).create).toHaveBeenCalledWith(selectedObject);
                }
        );

        it('should update an existing object on autosave',
            function() {

                    objectList.setChanged();

                    objectList.validateAndSave(selectedObject, false);
                    expect((<Datastore> mockDatastore).update).toHaveBeenCalledWith(selectedObject);
                }
        );

        it('should update an existing object on select change',
            function() {

                    objectList.setChanged();

                    objectList.validateAndSave(selectedObject, true);
                    expect((<Datastore> mockDatastore).update).toHaveBeenCalledWith(selectedObject);
                }
        );

        it('should restore a non valid object on select change with unsaved changes',
            function() {

                    mockDatastore.update.and.callFake(errorFunction);
                    objectList.setChanged();

                    expect(objectList.getObjects()[0]).toBe(selectedObject);
                    objectList.validateAndSave(selectedObject, true); // restore the oldVersion now.
                    expect(objectList.getObjects()[0]).toBe(oldVersion);
                }
        );

        it('should not restore a non valid object on autosave with unsaved changes',
            function() {

                mockDatastore.update.and.callFake(errorFunction);
                objectList.setChanged();

                expect(objectList.getObjects()[0]).toBe(selectedObject);
                objectList.validateAndSave(selectedObject, false); // do not restore the oldVersion now.
                expect(objectList.getObjects()[0]).toBe(selectedObject);
            }
        );

        it('should restore an invalid object on select change with invalid object',
            function() {

                selectedObject.valid = false;

                expect(objectList.getObjects()[0]).toBe(selectedObject);
                objectList.validateAndSave(selectedObject, true); // restore the oldVersion now.
                expect(objectList.getObjects()[0]).toBe(oldVersion);
            }
        );

        it('should not restore an invalid object on autosave with invalid object',
            function() {

                selectedObject.valid = false;

                expect(objectList.getObjects()[0]).toBe(selectedObject);
                objectList.validateAndSave(selectedObject, false); // restore the oldVersion now.
                expect(objectList.getObjects()[0]).toBe(selectedObject);
            }
        );

        it('should mark an object invalid if it cannot be stored in the database',
            function() {

                    mockDatastore.update.and.callFake(errorFunction);
                    objectList.setChanged();

                    expect(selectedObject.valid).toBe(true);
                    objectList.validateAndSave(selectedObject,false);
                    expect(selectedObject.valid).toBe(false);
                }
        );

        it('should add a message to the current messages if object has been marked invalid',
            function() {

                expect(messagesService.getMessages().length).toBe(0);

                mockDatastore.update.and.callFake(errorFunction);
                objectList.setChanged();
                objectList.validateAndSave(selectedObject, false);

                expect(messagesService.getMessages().length).toBe(1);
            }
        );

        it('should delete a message from the current messages if invalid marked object gets marked valid again',
            function() {

                expect(messagesService.getMessages().length).toBe(0);

                mockDatastore.update.and.callFake(errorFunction);
                objectList.setChanged();
                objectList.validateAndSave(selectedObject, false);

                expect(messagesService.getMessages().length).toBe(1);

                objectList.setChanged();
                objectList.validateAndSave(selectedObject, true);

                expect(messagesService.getMessages().length).toBe(0);
            }
        );
    });
}