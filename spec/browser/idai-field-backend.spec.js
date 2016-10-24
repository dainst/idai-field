"use strict";
/// <reference path="../../typings/globals/jasmine/index.d.ts" />
var idai_field_backend_1 = require("../../app/sync/idai-field-backend");
var http_1 = require("@angular/http");
/**
 * @author Daniel de Oliveira
 * @author Thomas Kleinke
 */
function main() {
    describe('IdaiFieldBackend', function () {
        var config = {
            backend: {
                uri: "uri",
                credentials: "user:password",
            }
        };
        var document = { "resource": {
                "id": "/object/id1",
                "identifier": "ob1",
                "title": "object1",
                "type": "object" },
            "synced": 0 };
        var documentWithDatasetIncorporated = { "resource": {
                "id": "/object/id1",
                "identifier": "ob1",
                "title": "object1",
                "type": "object" },
            "synced": 0,
            "dataset": "dataset1"
        };
        var successFunction = function () {
            return {
                subscribe: function (suc, err) {
                    suc("ok");
                }
            };
        };
        var failFunction = function () {
            return {
                subscribe: function (suc, err) {
                    err("fail");
                }
            };
        };
        var put = function (obj) {
            return {
                subscribe: function (suc, err) {
                    suc(obj);
                }
            };
        };
        var mockHttp;
        var mockDataModelConfiguration;
        var idaiFieldBackend;
        var j;
        beforeEach(function () {
            mockHttp = jasmine.createSpyObj('mockHttp', ['get', 'put']);
            mockHttp.get.and.callFake(successFunction);
            mockHttp.put.and.callFake(put);
            idaiFieldBackend = new idai_field_backend_1.IdaiFieldBackend(mockHttp, config);
            j = 0;
        });
        it('should report it is connected', function () {
            idaiFieldBackend.connectionStatus().subscribe(function (connected) {
                if (j == 1)
                    expect(connected).toBeTruthy();
                j++;
            });
            mockHttp.get.and.callFake(successFunction);
            idaiFieldBackend.checkConnection();
            expect(j).toBe(1);
        });
        it('should report is not connected', function () {
            idaiFieldBackend.connectionStatus().subscribe(function (connected) {
                if (j == 1)
                    expect(connected).toBeFalsy();
                j++;
            });
            mockHttp.get.and.callFake(successFunction);
            idaiFieldBackend.checkConnection();
            mockHttp.get.and.callFake(failFunction);
            idaiFieldBackend.checkConnection();
            expect(j).toBe(2);
        });
        it('should save a document to the backend', function (done) {
            var headers = new http_1.Headers();
            headers.append('Authorization', 'Basic ' + btoa(config.backend.credentials));
            idaiFieldBackend.save(document, "dataset1").then(function (obj) {
                expect(mockHttp.put).toHaveBeenCalledWith(config.backend.uri + document['resource']['id'], JSON.stringify(documentWithDatasetIncorporated), { headers: headers });
                done();
            }).catch(function (err) {
                fail(err);
                done();
            });
        });
    });
}
exports.main = main;
//# sourceMappingURL=idai-field-backend.spec.js.map