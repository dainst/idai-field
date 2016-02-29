import {fdescribe,describe,expect,fit,it,xit, inject,beforeEach, beforeEachProviders} from 'angular2/testing';
import {provide} from "angular2/core";
import {IndexeddbDatastore} from "../app/services/indexeddb-datastore";

/**
 * @author Daniel M. de Oliveira
 */
export function main() {
    describe('IndexeddbDatastore', () => {

        var datastore : IndexeddbDatastore;
        var request;
        var request2;
        var i;

        var object = {
            "identifier": "ob1",
            "title": "Title",
            "type": "Object",
            "synced": 0,
            "valid": true,
        };

        beforeEach(
            function () {
                var indexeddb   = jasmine.createSpyObj('indexed', [ 'transaction' ]);
                var transaction   = jasmine.createSpyObj('index', [ 'objectStore' ]);
                var objectStore   = jasmine.createSpyObj('ostore', [ 'put' ]);
                request   = jasmine.createSpyObj('request', [ 'a' ]);
                request2   = jasmine.createSpyObj('request', [ 'a' ]);

                indexeddb.transaction.and.callFake(function(){return transaction;});
                transaction.objectStore.and.callFake(function(){return objectStore;});

                i=0;
                objectStore.put.and.callFake(function(){if (i==0) {
                    i++; return request;} else return request2; });

                datastore = new IndexeddbDatastore();
                datastore.setDb({ then: function (db) { db(indexeddb); }});
            }
        );

        it('should do basic stuff',
            function (done) {

                var p= datastore.create(object);

                request.onerror("reqerror");
                request2.onerror("req2error");

                p.then(
                    () => {},
                    err => {expect(object["id"]).toBe(undefined);done()}
                );
            }
        );
    })
}