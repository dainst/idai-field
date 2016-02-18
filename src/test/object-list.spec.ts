import {describe,expect,fit,it,xit, inject, beforeEachProviders} from 'angular2/testing';
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
            //ObjectList,
            provide(Messages, {useClass: Messages})

        ]);

        var mockDatastore;

        beforeEach(function(){
            mockDatastore   = jasmine.createSpyObj('mockDatastore', [ 'create','update','refresh' ]);
            mockDatastore.create.and.callFake(function() {
                return new Promise((resolve, reject) => { resolve('ok')});
            });
            mockDatastore.update.and.callFake(function() {
                return new Promise((resolve, reject) => { resolve('ok')});
            });
            mockDatastore.refresh.and.callFake(function() {
                return new Promise((resolve, reject) => { resolve('ok')});
            });
        });


        it('should create a non existing object on changing object',
            inject([ Messages],
            ( messages:Messages) => {

                var objectList = new ObjectList(mockDatastore,messages);

                var selectFirst : IdaiFieldObject =
                    { "identifier": "ob4", "title": "Luke Skywalker", "synced": 0, "valid": true };
                var selectThen : IdaiFieldObject =
                    { "identifier": "ob5", "title": "Boba Fett", "synced": 0, "valid": true };

                objectList.setSelectedObject(selectFirst);
                objectList.setChanged();
                objectList.setSelectedObject(selectThen); // it will try to save selectFirst now.

                expect((<Datastore> mockDatastore).create).toHaveBeenCalledWith(selectFirst);
            })
        );


        it('should update an existing object on changing object',
            inject([ Messages],
            ( messages:Messages) => {

                var objectList = new ObjectList(mockDatastore,messages);

                var selectFirst : IdaiFieldObject =
                { "identifier": "ob4", "title": "Luke Skywalker", "synced": 0, "valid": true, "id" : "abc" };
                var selectThen : IdaiFieldObject =
                { "identifier": "ob5", "title": "Boba Fett", "synced": 0, "valid": true };

                objectList.setSelectedObject(selectFirst);
                objectList.setChanged();
                objectList.setSelectedObject(selectThen); // it will try to save selectFirst now.

                expect((<Datastore> mockDatastore).update).toHaveBeenCalledWith(selectFirst);
            })
        );

        it('should not update an existing not valid object on changing object',
            inject([ Messages],
            ( messages:Messages) => {

                var id="abc";

                var oldVersion : IdaiFieldObject =
                { "identifier": "ob4", "title": "Luke Skywalker", "synced": 0, "valid": true, "id" : id };

                mockDatastore.update=function() {
                    return {
                        then: function(suc,err) {
                            err("fail");
                        }
                    };
                };
                mockDatastore.refresh=function() {
                    return {
                        then: function(suc,err) {
                            suc(oldVersion);
                        }
                    };
                };

                var selectFirst : IdaiFieldObject =
                { "identifier": "ob4", "title": "Luke Skywalker 222", "synced": 0, "valid": true, "id" : id };
                var selectThen : IdaiFieldObject =
                { "identifier": "ob5", "title": "Boba Fett", "synced": 0, "valid": true };

                var objects : IdaiFieldObject[] = [selectFirst];
                var objectList = new ObjectList(mockDatastore,messages);
                objectList.setObjects(objects);

                objectList.setSelectedObject(selectFirst);
                objectList.setChanged();
                objectList.setSelectedObject(selectThen); // it will try to save selectFirst now.

                expect(objectList.getObjects()[0]).toBe(oldVersion);
            }
        ));
    });
}