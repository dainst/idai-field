import {describe,expect,fit,it,xit, inject, beforeEach,beforeEachProviders} from '@angular/core/testing';
import {provide} from "@angular/core";
import {IdaiFieldObject} from "../app/model/idai-field-object";
import {ObjectList} from "../app/services/object-list";
import {Datastore} from "../app/datastore/datastore";
import {Messages} from "../app/services/messages";
import {M} from "../app/m";

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

        var oldVersion:IdaiFieldObject = {
            "identifier": "ob4", "title": "Luke Skywalker (old)", "synced": 0,
            "type": "Object"
        };
        var selectedObject:IdaiFieldObject;

        var getFunction = function (id) {
            return {
                then: function (suc, err) {
                    if (id == selectedObject.id)
                        suc(selectedObject);
                    else
                        err("wrong id");
                }
            };
        };

        var successFunction = function () {
            return {
                then: function (suc, err) {
                    suc("ok");
                }
            };
        };

        var errorFunction = function () {
            return new Promise<any>((resolve, reject) => {
                reject("objectlist/idexists");
            });
        };

        var restoreFunction = function () {
            return {
                then: function (suc, err) {
                    suc(oldVersion);
                }
            };
        };

        beforeEach(function () {

            mockDatastore = jasmine.createSpyObj('mockDatastore', ['get', 'create', 'update', 'refresh']);
            objectList = new ObjectList(mockDatastore);

            // selectedObject = {
            //     "identifier": "ob4", "title": "Luke Skywalker", "synced": 0,
            //     "id": id, "type": "Object"
            // };
            // objectList.setObjects([selectedObject]);
            //
            // mockDatastore.get.and.callFake(getFunction);
            // mockDatastore.create.and.callFake(successFunction);
            // mockDatastore.update.and.callFake(successFunction);
            // mockDatastore.refresh.and.callFake(restoreFunction);
        });

        it('should do nothing for now',
            function (done) {
                done();
            }
        );
    })
}