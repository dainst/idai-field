"use strict";
var file_system_mediastore_1 = require("../../app/datastore/file-system-mediastore");
var fs = require('fs');
var rimraf = require('rimraf');
/**
 * @author Sebastian Cuy
 */
describe('FileSystemMediastore', function () {
    var store;
    var storePath = 'store/';
    beforeEach(function () {
        fs.mkdirSync(storePath);
        store = new file_system_mediastore_1.FileSystemMediastore();
    });
    afterEach(function (done) {
        rimraf(storePath, function () {
            done();
        });
    });
    it('should create a file', function (done) {
        store.create('test_create', 'asdf').then(function () {
            fs.readFile(storePath + 'test_create', function (err, data) {
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
        store.create('test_read', 'qwer')
            .then(function () { return store.read('test_read'); })
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
        store.create('test_update', 'yxcv')
            .then(function () { return store.update('test_update', 'yxcvb'); })
            .then(function () {
            fs.readFile(storePath + 'test_update', function (err, data) {
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
        store.create('test_remove', 'sdfg')
            .then(function () {
            return store.remove('test_remove')
                .then(function () {
                store.read('test_remove')
                    .then(function () {
                    fail('reading removed file worked unexpectedly');
                    done();
                })
                    .catch(function (err) {
                    expect(err.code).toEqual('ENOENT');
                    fs.readFile(storePath + 'test_remove', function (err) {
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
//# sourceMappingURL=file-system-mediastore.spec.js.map