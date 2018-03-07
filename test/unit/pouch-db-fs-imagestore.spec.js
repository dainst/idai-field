"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var imagestore_errors_1 = require("../../app/core/imagestore/imagestore-errors");
/**
 * @author Sebastian Cuy
 */
// override nodes require function in order to make special
// systemjs requires starting with '@node' work
var Module = require('module');
var originalRequire = Module.prototype.require;
Module.prototype.require = function () {
    if (arguments[0].startsWith('@node'))
        arguments[0] = arguments[0].substring(6);
    return originalRequire.apply(this, arguments);
};
var pouch_db_fs_imagestore_1 = require("../../app/core/imagestore/pouch-db-fs-imagestore");
var fs = require("fs");
var rimraf = require("rimraf");
var PouchDB = require("pouchdb");
var pouchdb_manager_1 = require("../../app/core/datastore/core/pouchdb-manager");
var index_facade_1 = require("../../app/core/datastore/index/index-facade");
// helper functions for converting strings to ArrayBuffers and vice versa
function str2ab(str) {
    var buf = new ArrayBuffer(str.length); // 2 bytes for each char
    var bufView = new Uint8Array(buf);
    for (var i = 0, strLen = str.length; i < strLen; i++) {
        bufView[i] = str.charCodeAt(i);
    }
    return buf;
}
function ab2str(buf) {
    return String.fromCharCode.apply(null, new Uint8Array(buf));
}
describe('PouchDbFsImagestore', function () {
    var store;
    var manager;
    var storeProjectPath = 'store/unittest/';
    beforeEach(function () {
        var mockBlobMaker = jasmine.createSpyObj('blobProxy', ['makeBlob']);
        mockBlobMaker.makeBlob.and.callFake(function (data) { return { safeResourceUrl: data }; });
        var mockConverter = jasmine.createSpyObj('converter', ['convert']);
        mockConverter.convert.and.callFake(function (data) { return data; });
        var mockConfigProvider = jasmine.createSpyObj('configProvider', ['getProjectConfiguration']);
        mockConfigProvider.getProjectConfiguration.and.callFake(function () { return {}; });
        var mockConstraintIndexer = jasmine.createSpyObj('mockConstraintIndexer', ['update', 'clear']);
        var mockFulltextIndexer = jasmine.createSpyObj('mockFulltextIndexer', ['add', 'clear']);
        manager = new pouchdb_manager_1.PouchdbManager(mockConfigProvider, new index_facade_1.IndexFacade(mockConstraintIndexer, mockFulltextIndexer));
        manager.setProject('unittest');
        store = new pouch_db_fs_imagestore_1.PouchDbFsImagestore(mockConverter, mockBlobMaker, manager);
        store.setPath('store/', 'unittest');
    });
    afterEach(function (done) {
        rimraf(storeProjectPath, function () {
            return new PouchDB('unittest').destroy().then(done);
        });
    });
    it('should create a file', function (done) {
        console.log('should create a file');
        store.create('test_create', str2ab('asdf')).then(function () {
            fs.readFile(storeProjectPath + 'test_create', function (err, data) {
                if (err)
                    fail(err);
                expect(data.toString()).toEqual('asdf');
                done();
            });
        }).catch(function (err) {
            fail(err);
            done();
        });
    });
    it('should read a file', function (done) {
        store.create('test_read', str2ab('qwer'))
            .then(function () { return store.read('test_read', false, false); })
            .then(function (data) {
            expect(data.toString()).toEqual('qwer');
            done();
        })
            .catch(function (err) {
            fail(err);
            done();
        });
    });
    it('should update a file', function (done) {
        store.create('test_update', str2ab('yxcv'))
            .then(function () { return store.update('test_update', str2ab('yxcvb')); })
            .then(function () {
            fs.readFile(storeProjectPath + 'test_update', function (err, data) {
                expect(err).toBe(null);
                expect(data.toString()).toEqual('yxcvb');
                done();
            });
        })
            .catch(function (err) {
            fail(err);
            done();
        });
    });
    it('should remove a file', function (done) {
        spyOn(console, 'error'); // to suppress console.error output
        store.create('test_remove', str2ab('sdfg'))
            .then(function () {
            return store.remove('test_remove')
                .then(function () {
                store.read('test_remove', false, false)
                    .then(function (result) {
                    // missing original is ok
                    expect(result).toEqual('');
                    return store.read('test_remove', false, true);
                })
                    .then(function () {
                    // missing thumb is not ok
                    fail('reading removed file worked unexpectedly');
                    done();
                })
                    .catch(function (err) {
                    expect(err[0]).toEqual(imagestore_errors_1.ImagestoreErrors.NOT_FOUND);
                    fs.readFile(storeProjectPath + 'test_remove', function (err) {
                        expect(err).toBeTruthy();
                        expect(err.code).toEqual('ENOENT');
                        done();
                    });
                });
            })
                .catch(function (err) {
                fail(err);
                done();
            });
        })
            .catch(function (err) {
            fail(err);
            done();
        });
    });
});
//# sourceMappingURL=pouch-db-fs-imagestore.spec.js.map