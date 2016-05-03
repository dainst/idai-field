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

        var getFunction = function(id) {
            return {
                then: function(suc, err) {
                    if (id == selectedObject.id)
                        suc(selectedObject);
                    else
                        err("wrong id");
                }
            };
        };

        var successFunction = function() {
            return {
                then: function(suc, err) {
                    suc("ok");
                }
            };
        };

        var errorFunction = function() {
            return new Promise<any>((resolve, reject) => {
                reject("objectlist/idexists");
            });
        };

        var restoreFunction = function() {
            return {
                then: function(suc, err) {
                    suc(oldVersion);
                }
            };
        };

        beforeEach(function() {

            mockDatastore = jasmine.createSpyObj('mockDatastore', [ 'get', 'create','update','refresh' ]);
            objectList = new ObjectList(mockDatastore);

            selectedObject = { "identifier": "ob4", "title": "Luke Skywalker", "synced": 0, "valid": true,
                "id" : id, "type": "Object" };
            objectList.setObjects([selectedObject]);

            mockDatastore.get.and.callFake(getFunction);
            mockDatastore.create.and.callFake(successFunction);
            mockDatastore.update.and.callFake(successFunction);
            mockDatastore.refresh.and.callFake(restoreFunction);
        });

        it('should create a non existing object on save',
            function(done) {

                delete selectedObject.id;
                objectList.setChanged(selectedObject, true);

                objectList.trySave().then(
                    () => {
                        expect((<Datastore> mockDatastore).create).toHaveBeenCalledWith(selectedObject);
                        done();
                    },
                    err => {
                        fail();
                        done();
                    }
                );
            }
        );

        it('should update an existing object on save',
            function(done) {

                objectList.setChanged(selectedObject, true);

                objectList.trySave().then(
                    () => {
                        expect((<Datastore> mockDatastore).update).toHaveBeenCalledWith(selectedObject);
                        done();
                    },
                    err => {
                        fail();
                        done();
                    }
                );
            }
        );

        it('should restore an object',
            function(done) {

                objectList.setChanged(selectedObject, true);
                expect(objectList.getObjects()[0]).toBe(selectedObject);

                objectList.restoreAll().then(
                    () => {
                        expect(objectList.getObjects()[0]).toBe(oldVersion);
                        done();
                    },
                    err => {
                        fail();
                        done();
                    }
                );
            }
        );

        it('should keep an object marked as changed if it cannot be stored in the database',
            function(done) {

                mockDatastore.update.and.callFake(errorFunction);
                objectList.setChanged(selectedObject, true);

                objectList.trySave().then(
                    () => {
                        fail();
                        done();
                    },
                    err => {
                        expect(objectList.isChanged(selectedObject)).toBe(true);
                        done();
                    }
                );
            }
        );

        it('should return a message key in case object cannot get stored',
            function(done) {

                mockDatastore.update.and.callFake(errorFunction);
                objectList.setChanged(selectedObject, true);

                objectList.trySave().then(
                    () => {
                        fail();
                        done();
                    },
                    errors => {
                        expect(errors).not.toBe(undefined);
                        done();
                    }
                );
            }
        );

        it('should not return a message key in case object can get stored',
            function(done) {

                objectList.setChanged(selectedObject, true);

                objectList.trySave().then(
                    result => {
                        expect(result).toBe(undefined);
                        done();
                    },
                    err => {
                        fail();
                        done();
                    }
                );
            }
        );
    });
}