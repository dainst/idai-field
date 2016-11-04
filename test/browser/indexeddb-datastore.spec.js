"use strict";
/// <reference path="../../typings/globals/jasmine/index.d.ts" />
var indexeddb_datastore_1 = require("../../app/datastore/indexeddb-datastore");
/**
 * @author Daniel de Oliveira
 */
function main() {
    describe('IndexeddbDatastore', function () {
        var datastore;
        var request;
        var request2;
        var i;
        var object = {
            "resource": {
                "identifier": "ob1",
                "title": "Title",
                "type": "Object",
                "synced": 0,
                "valid": true
            }
        };
        beforeEach(function () {
            var indexeddb = jasmine.createSpyObj('indexeddb', ['put']);
            request = jasmine.createSpyObj('request', ['a']);
            request2 = jasmine.createSpyObj('request', ['a']);
            i = 0;
            indexeddb.put.and.callFake(function () {
                if (i == 0) {
                    i++;
                    return request;
                }
                else
                    return request2;
            });
            datastore = new indexeddb_datastore_1.IndexeddbDatastore({ db: function () { return { then: function (db) { db(indexeddb); } }; } });
        });
        it('should revert id on failed creation', function (done) {
            var p = datastore.create(object);
            request.onerror("reqerror");
            p.then(function () {
                fail();
                done();
            }, function (err) {
                expect(object["id"]).toBe(undefined);
                done();
            });
        });
    });
}
exports.main = main;
//# sourceMappingURL=indexeddb-datastore.spec.js.map