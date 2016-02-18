import {describe,expect,fit,it,xit, inject, beforeEach,beforeEachProviders} from 'angular2/testing';
import {provide} from "angular2/core";
import {IdaiFieldObject} from "../app/model/idai-field-object";
import {ObjectList} from "../app/services/object-list";
import {Datastore} from "../app/services/datastore";
import {Messages} from "../app/services/messages";


/**
 * @author Daniel M. de Oliveira
 */
export function main() {
    describe('ObjectList', () => {

        beforeEachProviders(() => [
            provide(Messages, {useClass: Messages})
        ]);

        var mockDatastore;
        var objectList;
        var id = "abc";

        var selectFirst : IdaiFieldObject;
        var selectThen : IdaiFieldObject;
        var oldVersion : IdaiFieldObject;

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
                    err("fail");
                }
            };
        };

        beforeEach(
            inject([ Messages],
            ( messages:Messages) => {

            mockDatastore   = jasmine.createSpyObj('mockDatastore', [ 'create','update','refresh' ]);
            objectList = new ObjectList(mockDatastore,messages);

            selectFirst = { "identifier": "ob4", "title": "Luke Skywalker", "synced": 0, "valid": true , "id" : id };
            selectThen  = { "identifier": "ob5", "title": "Boba Fett", "synced": 0, "valid": true };
            oldVersion  = {"identifier": "ob4", "title": "Luke Skywalker (old)", "synced": 0, "valid": true };
            objectList.setObjects([selectFirst]);

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


        it('should create a non existing object on changing object',
            inject([ Messages],
            ( messages:Messages) => {

                delete selectFirst.id;

                objectList.setSelectedObject(selectFirst);
                objectList.setChanged();
                objectList.setSelectedObject(selectThen); // create selectFirst now.

                expect((<Datastore> mockDatastore).create).toHaveBeenCalledWith(selectFirst);
            })
        );


        it('should update an existing object on changing object',
            inject([ Messages],
            ( messages:Messages) => {

                objectList.setSelectedObject(selectFirst);
                objectList.setChanged();
                objectList.setSelectedObject(selectThen); // update selectFirst now.

                expect((<Datastore> mockDatastore).update).toHaveBeenCalledWith(selectFirst);
            })
        );

        it('should not update an existing not valid object on changing object',
            inject([ Messages],
            ( messages:Messages) => {

                mockDatastore.update.and.callFake(errorFunction);

                objectList.setSelectedObject(selectFirst);
                objectList.setChanged();
                objectList.setSelectedObject(selectThen); // restore the oldVersion now.

                expect(objectList.getObjects()[0]).toBe(oldVersion);
                expect((<Datastore> mockDatastore).update).toHaveBeenCalledWith(selectFirst);
                expect((<Datastore> mockDatastore).refresh).toHaveBeenCalledWith(id);
            }
        ));

        it('should restore an invalid object on demand',
            inject([ Messages],
            ( messages:Messages) => {

                selectFirst.valid = false;

                objectList.setSelectedObject(selectFirst);
                objectList.setSelectedObject(selectThen); // restore the oldVersion now.

                expect(objectList.getObjects()[0]).toBe(oldVersion);
                expect((<Datastore> mockDatastore).refresh).toHaveBeenCalledWith(id);
            }
        ));

        it('mark an object invalid',
            inject([ Messages],
            ( messages:Messages) => {

                mockDatastore.update.and.callFake(errorFunction);

                objectList.setSelectedObject(selectFirst);
                expect(selectFirst.valid).toBe(true);
                objectList.setChanged();
                objectList.validateAndSave(selectFirst,false);
                expect(selectFirst.valid).toBe(false);

                expect((<Datastore> mockDatastore).update).toHaveBeenCalledWith(selectFirst);
            }
        ));

        // TODO test creates message

        // TODO test deletes message
    });
}