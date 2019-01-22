/**
 * This test suite focuses on the differences between the Data Access Objects.
 *
 * Depending of the Type Class T and based on document.resource.type,
 * well-formed documents are about to be created.
 *
 * @author Daniel de Oliveira
 * @author Thomas Kleinke
 */
import {createApp, setupSyncTestDb} from './subsystem-helper';
import * as PouchDB from 'pouchdb';
import {Static} from '../unit/static';


describe('DAOs/Convert/Subsystem', () => {

    let image0;
    let trench0;
    let _documentDatastore;
    let _idaiFieldDocumentDatastore;
    let _idaiFieldImageDocumentDatastore;


    function expectErr(err) {

        if (!err) fail("Wrong Err - undefined");
        if (err.indexOf('Unknown type') === -1) fail('Wrong Err' + err);
    }


    beforeEach(async done => {

        await setupSyncTestDb();

        const {
            remoteChangesStream,
            viewFacade,
            documentHolder,
            documentDatastore,
            idaiFieldDocumentDatastore,
            idaiFieldImageDocumentDatastore
        } = await createApp();

        _documentDatastore = documentDatastore;
        _idaiFieldDocumentDatastore = idaiFieldDocumentDatastore;
        _idaiFieldImageDocumentDatastore = idaiFieldImageDocumentDatastore;

        image0 = Static.doc('Image','Image','Image','image0');
        trench0 = Static.doc('Trench','Trench','Trench','trench0');

        image0 = await _idaiFieldImageDocumentDatastore.create(image0);
        trench0 = await _idaiFieldDocumentDatastore.create(trench0);
        done();
    });


    afterEach(async done => {

        await new PouchDB('testdb').destroy();
        done();
    }, 5000);


    // create

    it('FieldDocumentDatastore - add relations with create', async done => {

        try {
            expect((await _idaiFieldImageDocumentDatastore.
            create(Static.doc('Image','Image','Image','image1'))).
                resource.relations.depicts).toEqual([]);
        } catch (err) {
            fail(err);
        }
        done();
    });


    it('FieldDocumentDatastore - add relations with create', async done => {

        try {
            expect((await _idaiFieldDocumentDatastore.
            create(Static.doc('Trench','Trench','Trench','trench1'))).
                resource.relations.isRecordedIn).toEqual([]);
        } catch (err) {
            fail(err);
        }
        done();
    });


    it('create - unknown type', async done => {

        try {
            expect((await _idaiFieldDocumentDatastore.
            create(Static.doc('Trench','Trench','Unknown','trench1'))).
                resource.relations.isRecordedIn).toEqual([]);
            fail();
        } catch (err) {
            expectErr(err);
        }
        done();
    });


    // update

    it('ImageDocumentDatastore - add relations with update', async done => {

        delete image0.resource.relations.depicts;
        expect((await _idaiFieldImageDocumentDatastore.update(image0)).resource.relations.depicts).toEqual([]);
        done();
    });


    it('FieldDocumentDatastore - add relations with update', async done => {

        delete trench0.resource.relations.isRecordedIn;
        expect((await _idaiFieldDocumentDatastore.
        update(trench0)).resource.relations.isRecordedIn).toEqual([]);
        done();
    });


    // get

    it('get - add relations for IdaiFieldDocument', async done => {

        expect((await _idaiFieldDocumentDatastore.get('trench0', { skip_cache: true })).
            resource.relations.isRecordedIn).toEqual([]);
        expect((await _idaiFieldDocumentDatastore.get('trench0', { skip_cache: false })).
            resource.relations.isRecordedIn).toEqual([]);
        expect((await _documentDatastore.get('trench0', { skip_cache: true })).
            resource.relations.isRecordedIn).toEqual([]);
        expect((await _documentDatastore.get('trench0', { skip_cache: false })).
            resource.relations.isRecordedIn).toEqual([]);
        done();
    });


    it('get - add relations for IdaiFieldImageDocument', async done => {

        expect((await _idaiFieldImageDocumentDatastore.get('image0', { skip_cache: true })).
            resource.relations.depicts).toEqual([]);
        expect((await _idaiFieldImageDocumentDatastore.get('image0', { skip_cache: false })).
            resource.relations.depicts).toEqual([]);
        expect((await _documentDatastore.get('image0', { skip_cache: true })).
            resource.relations.depicts).toEqual([]);
        expect((await _documentDatastore.get('image0', { skip_cache: false })).
            resource.relations.depicts).toEqual([]);
        done();
    });


    // find

    it('find - add relations for IdaiFieldDocument', async done => {

        expect((await _idaiFieldDocumentDatastore.find({})). // result coming from cache
            documents[0].resource.relations.isRecordedIn).toEqual([]);
        expect((await _idaiFieldImageDocumentDatastore.find({})). // result coming from cache
            documents[0].resource.relations.depicts).toEqual([]);
        done();
    });
});

