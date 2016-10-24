/// <reference path="../../typings/globals/jasmine/index.d.ts" />
import {Mediastore} from"../../app/datastore/mediastore";
import {FileSystemMediastore} from "../../app/datastore/file-system-mediastore";

import fs = require('fs');
import rimraf = require('rimraf');

/**
 * @author Sebastian Cuy
 */

describe('FileSystemMediastore', () => {

    var store: Mediastore;
    var storePath = 'store/';

    beforeEach(() => {
        fs.mkdirSync(storePath);
        store = new FileSystemMediastore();
    });

    afterEach(done => {
        rimraf(storePath, () => {
            done();
        });
    });

    it('should create a file', (done) => {

        store.create('test_create', 'asdf').then(() => {
            fs.readFile(storePath + 'test_create', (err, data) => {
                if (err) fail(err);
                expect(data.toString()).toEqual('asdf');
                done();
            });
        }).catch(err => {
            fail(err);
            done();
        });
    });

    it('should read a file', (done) => {

        store.create('test_read', 'qwer')
            .then(() => { return store.read('test_read'); })
            .then((data) => {
                expect(data.toString()).toEqual('qwer');
                done();
            })
            .catch(err => {
                fail(err);
                done();
            });
    });

    it('should update a file', (done) => {

        store.create('test_update', 'yxcv')
            .then(() => { return store.update('test_update', 'yxcvb'); })
            .then(() => {
                fs.readFile(storePath + 'test_update', (err, data) => {
                    expect(err).toBe(null);
                    expect(data.toString()).toEqual('yxcvb');
                    done();
                });
            })
            .catch(err => {
                fail(err);
                done();
            });
    });

    it('should remove a file', (done) => {

        store.create('test_remove', 'sdfg')
            .then(() => {
                return store.remove('test_remove')
                    .then(() => {
                        store.read('test_remove')
                            .then(() => {
                                fail('reading removed file worked unexpectedly');
                                done();
                            })
                            .catch(err => {
                                expect(err.code).toEqual('ENOENT');
                                fs.readFile(storePath + 'test_remove', (err) => {
                                    expect(err).toBeTruthy();
                                    expect(err.code).toEqual('ENOENT');
                                    done();
                                });
                            });
                    })
                    .catch(err => {
                        fail(err);
                        done();
                    })
            })
            .catch(err => {
                fail(err);
                done();
            });
    });

});