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

        var selectFirst : IdaiFieldObject;
        var selectThen : IdaiFieldObject;

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
            mockDatastore.create.and.callFake(successFunction);
            mockDatastore.update.and.callFake(successFunction);

            objectList = new ObjectList(mockDatastore,messages);

            selectFirst = { "identifier": "ob4", "title": "Luke Skywalker", "synced": 0, "valid": true , "id" : "abc"};
            selectThen  = { "identifier": "ob5", "title": "Boba Fett", "synced": 0, "valid": true };
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

                var oldVersion : IdaiFieldObject =
                    { "identifier": "ob4", "title": "Luke Skywalker (old)", "synced": 0, "valid": true };

                mockDatastore.update.and.callFake(errorFunction);
                mockDatastore.refresh.and.callFake(function() {
                    return {
                        then: function(suc,err) {
                            suc(oldVersion);
                        }
                    };
                });

                objectList.setObjects([selectFirst]);
                objectList.setSelectedObject(selectFirst);
                objectList.setChanged();
                objectList.setSelectedObject(selectThen); // restore the oldVersion now.

                expect(objectList.getObjects()[0]).toBe(oldVersion);
                expect((<Datastore> mockDatastore).update).toHaveBeenCalled();
                expect((<Datastore> mockDatastore).refresh).toHaveBeenCalled();
            }
        ));
    });
}