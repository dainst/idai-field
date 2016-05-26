import {describe,expect,fit,it,xit, inject, beforeEach,beforeEachProviders} from '@angular/core/testing';
import {provide} from "@angular/core";
import {Entity} from "../app/core-services/entity";
import {PersistenceManager} from "../app/core-services/persistence-manager";
import {Datastore} from "../app/core-services/datastore";
import {Messages} from "../app/core-services/messages";
import {M} from "../app/m";

/**
 * @author Daniel M. de Oliveira
 * @author Thomas Kleinke
 */
export function main() {
    fdescribe('PersistenceManager', () => {

        beforeEachProviders(() => [
            provide(Messages, {useClass: Messages}),
            provide(M, {useClass: M})
        ]);

        var mockDatastore;
        var mockRelationsProvider;
        var persistenceManager;
        var id = "abc";

        var relatedObject :Entity = {
            "id": "2" , "identifier": "ob2", "title": "Title2",
            "type": "Object"
        }

        var getFunction = function (id) {
            return {
                then: function (suc, err) {
                    if (id == relatedObject.id)
                        suc(relatedObject);
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

        var relF = function(n) {
            if (n=="BelongsTo") return true;
            return false;
        }


        beforeEach(function () {

            mockRelationsProvider = jasmine.createSpyObj('mockRelationsProvider',['isRelationProperty','getInverse'])
            mockDatastore = jasmine.createSpyObj('mockDatastore', ['get', 'create', 'update', 'refresh']);
            persistenceManager = new PersistenceManager(mockDatastore,mockRelationsProvider);
            mockRelationsProvider.isRelationProperty.and.callFake(relF);
            mockRelationsProvider.getInverse.and.returnValue("Contains");
            mockDatastore.get.and.callFake(getFunction);
            mockDatastore.update.and.callFake(successFunction);
            mockDatastore.create.and.callFake(successFunction);

        });

        it('save the base object',
            function (done) {

                var object :Entity = {
                    "id": "1" , "identifier": "ob1", "title": "Title",
                    "type": "Object"
                }

                persistenceManager.load(object);
                persistenceManager.persist().then(()=>{
                    expect(mockDatastore.update).toHaveBeenCalledWith(object);
                    done();
                },(err)=>{fail(err);done();});
            }
        );

        fit('save the related object',
            function (done) {

                var object = {
                    "id" :"1", "identifier": "ob1", "title": "Title1", "BelongsTo" : [ "2" ],
                    "type": "Object", "synced" : 0
                }

                persistenceManager.load(object);
                persistenceManager.persist().then(()=>{

                    expect(mockDatastore.update).toHaveBeenCalledWith(object);
                    expect(mockDatastore.update).toHaveBeenCalledWith(relatedObject);
                    done();

                },(err)=>{fail(err);done();});
            }
        );
    })
}