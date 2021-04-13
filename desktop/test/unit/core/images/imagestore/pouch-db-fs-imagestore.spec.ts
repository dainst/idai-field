import fs = require('fs');
import rimraf = require('rimraf');
import PouchDB = require('pouchdb-node');
import { ConstraintIndex, Indexer, IndexFacade, PouchdbManager } from 'idai-field-core';
import { ImagestoreErrors } from '../../../../../src/app/core/images/imagestore/imagestore-errors';
import { PouchDbFsImagestore } from '../../../../../src/app/core/images/imagestore/pouch-db-fs-imagestore';


/**
 * @author Sebastian Cuy
 */
// helper functions for converting strings to ArrayBuffers and vice versa
function str2ab(str: string): ArrayBuffer {

    const buf = new ArrayBuffer(str.length); // 2 bytes for each char
    const bufView = new Uint8Array(buf);
    for (let i = 0, strLen = str.length; i < strLen; i++) {
        bufView[i] = str.charCodeAt(i);
    }
    return buf;
}


describe('PouchDbFsImagestore', () => {

    let store: PouchDbFsImagestore;
    let manager: PouchdbManager;
    const storeProjectPath = 'test/store/unittest/';


    beforeEach(async done => {
        const mockBlobMaker = jasmine.createSpyObj('blobProxy',['makeBlob']);
        mockBlobMaker.makeBlob.and.callFake(data => { return { safeResourceUrl: data }; });
        const mockImageConverter = jasmine.createSpyObj('imageConverter', ['convert']);
        mockImageConverter.convert.and.callFake(data => { return data; });
        const mockConfigProvider =  jasmine.createSpyObj('configProvider', ['getProjectConfiguration']);
        mockConfigProvider.getProjectConfiguration.and.callFake(() =>{ return {} });
        const mockFulltextIndexer = jasmine.createSpyObj('mockFulltextIndexer', ['add', 'clear']);
        manager = new PouchdbManager((name: string) => new PouchDB(name));

        const mockConstraintIndexer = ConstraintIndex.make(
            {}, [] as any);

        await manager.createDb('unittest', { _id: 'project', resource: { id: 'project' }}, false);

        await Indexer.reindex(new IndexFacade(mockConstraintIndexer, mockFulltextIndexer, undefined, false),
                              manager.getDb(), null, null);

        store = new PouchDbFsImagestore(mockImageConverter, mockBlobMaker, manager.getDb());
        await store.init({ imagestorePath: 'test/store/', selectedProject: 'unittest' } as any);

        done();
    });


    afterEach(done => {
        rimraf(storeProjectPath, () => {
            return new PouchDB('unittest').destroy().then(done);
        });
    });


    it('should create a file', (done) => {

        store.create('test_create', str2ab('asdf')).then(() => {
            fs.readFile(storeProjectPath + 'test_create', (err, data) => {
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
            .then(() => { return store.read('test_read',false,false); })
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

        store.create('test_update', str2ab('yxcv'))
            .then(() => { return store.update('test_update', str2ab('yxcvb')); })
            .then(() => {
                fs.readFile(storeProjectPath + 'test_update', (err, data) => {
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

        spyOn(console, 'error'); // to suppress console.error output
        store.create('test_remove', str2ab('sdfg'))
            .then(() => {
                return store.remove('test_remove')
                    .then(() => {
                        store.read('test_remove', false, false)
                            .then(result => {
                                // missing original is ok
                                expect(result).toEqual('');
                                return store.read('test_remove', false, true);
                            })
                            .then(() => {
                                // missing thumb is not ok
                                fail('reading removed file worked unexpectedly');
                                done();
                            })
                            .catch(err => {
                                expect(err[0]).toEqual(ImagestoreErrors.NOT_FOUND);

                                fs.readFile(storeProjectPath + 'test_remove', (err) => {
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
