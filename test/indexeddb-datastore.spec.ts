import {fdescribe,describe,xdescribe,expect,fit,it,xit, inject,beforeEach, beforeEachProviders} from '@angular/core/testing';
import {IndexeddbDatastore} from "../app/datastore/indexeddb-datastore";
import {Indexeddb} from "../app/datastore/indexeddb";

/**
 * @author Daniel de Oliveira
 */
export function main() {
    describe('IndexeddbDatastore', () => {

        var datastore : IndexeddbDatastore;
        var request;
        var request2;
        var i;

        var object = {
            "resource" : {
                "identifier": "ob1",
                "title": "Title",
                "type": "Object",
                "synced": 0,
                "valid": true
            }
        };

        beforeEach(
            function () {
                var indexeddb   = jasmine.createSpyObj('indexeddb', [ 'put' ]);
                request   = jasmine.createSpyObj('request', [ 'a' ]);
                request2   = jasmine.createSpyObj('request', [ 'a' ]);

                i=0;
                indexeddb.put.and.callFake(function(){if (i==0) {
                    i++; return request;} else return request2; });

                datastore = new IndexeddbDatastore(
                    <Indexeddb> { db: function(){return { then: function (db) { db(indexeddb); }}}});
            }
        );

        it('should revert id on failed creation',
            function (done) {

                var p= datastore.create(object);

                request.onerror("reqerror");
                request2.onerror("req2error");

                p.then(
                    () => {
                        fail(); done();
                    },
                    err => {
                        expect(object["id"]).toBe(undefined); done()
                    }
                );
            }
        );
    })
}