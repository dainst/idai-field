/**
 * @author Sebastian Cuy
 */

// override nodes require function in order to make special
// systemjs requires starting with '@node' work
var Module = require('module');
var originalRequire = Module.prototype.require;
Module.prototype.require = function() {
    if (arguments[0].startsWith('@node')) arguments[0] = arguments[0].substring(6);
    return originalRequire.apply(this, arguments);
};

import {Mediastore} from"../../app/imagestore/mediastore";
import {FileSystemImagestore} from "../../app/imagestore/file-system-imagestore";

import fs = require('fs');
import rimraf = require('rimraf');

// helper functions for converting strings to ArrayBuffers and vice versa
function str2ab(str: string): ArrayBuffer {
    var buf = new ArrayBuffer(str.length); // 2 bytes for each char
    var bufView = new Uint8Array(buf);
    for (var i=0, strLen=str.length; i<strLen; i++) {
        bufView[i] = str.charCodeAt(i);
    }
    return buf;
}

function ab2str(buf: ArrayBuffer): string {
    return String.fromCharCode.apply(null, new Uint8Array(buf));
}

// var Reflect = {
//     getMetadata: function() {
//         return ""
//     }
// }

describe('FileSystemImagestore', () => {


    var store: Mediastore;
    var storePath = 'store/';

    beforeEach(() => {
        fs.mkdirSync(storePath);
        store = new FileSystemImagestore(storePath,false);
    });

    afterEach(done => {
        rimraf(storePath, () => {
            done();
        });
    });

    it('should create a file', (done) => {

        store.create('test_create', str2ab('asdf')).then(() => {
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

        store.create('test_read', str2ab('qwer'))
            .then(() => { return store.read('test_read'); })
            .then((data) => {
                expect(ab2str(data)).toEqual('qwer');
                done();
            })
            .catch(err => {
                fail(err);
                done();
            });
    });

    it('should update a file', (done) => {

        store.create('test_update', str2ab('yxcv'))
            .then(() => { return store.update('test_update', str2ab('yxcvb')); })
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

        store.create('test_remove', str2ab('sdfg'))
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