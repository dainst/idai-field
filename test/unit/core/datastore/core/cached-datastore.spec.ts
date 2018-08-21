import {IdaiFieldDocument} from 'idai-components-2';
import {CachedDatastore} from '../../../../../app/core/datastore/core/cached-datastore';
import {DocumentCache} from '../../../../../app/core/datastore/core/document-cache';
import {IdaiFieldDocumentDatastore} from '../../../../../app/core/datastore/field/idai-field-document-datastore';
import {IdaiFieldTypeConverter} from '../../../../../app/core/datastore/field/idai-field-type-converter';
import {Static} from '../../../static';


/**
 * @author Daniel de Oliveira
 */
describe('CachedDatastore', () => {

    let ds: IdaiFieldDocumentDatastore;
    let mockdb: any;
    let mockIndexFacade: any;

    function createMockedDatastore(
        mockdb: any
    ) {

        const mockTypeUtility = jasmine.createSpyObj('mockTypeUtility',
            ['isSubtype', 'validate', 'getNonImageTypeNames']);
        mockTypeUtility.isSubtype.and.returnValue(false);
        mockTypeUtility.getNonImageTypeNames.and.returnValue(['Find']);

        const documentCache = new DocumentCache<IdaiFieldDocument>();
        const docDatastore = new IdaiFieldDocumentDatastore(
            mockdb,
            mockIndexFacade,
            documentCache,
            new IdaiFieldTypeConverter(mockTypeUtility));
        docDatastore.suppressWait = true;
        return docDatastore;
    }


    function verifyIsIdaiFieldDocument(document) {

        expect(document.resource.identifier).toEqual('');
        expect(document.resource.relations.isRecordedIn).toEqual([]);
    }


    beforeEach(() => {

        mockdb = jasmine.createSpyObj('mockdb',
                ['create', 'update', 'fetch', 'fetchRevision']);
        mockIndexFacade = jasmine.createSpyObj('mockIndexFacade',
            ['perform', 'put', 'remove']);


        mockdb.update.and.callFake(function(dd) {
            // working with the current assumption that the inner pouchdbdatastore datastore return the same instance
            dd.resource.id = '1';
            dd['_rev'] = '2';
            return Promise.resolve(dd);
        });
        mockIndexFacade.perform.and.callFake(function() {
            const d = Static.doc('sd1');
            d.resource.id = '1';
            return['1'];
        });
        mockIndexFacade.put.and.callFake(function(doc) {
            return Promise.resolve(doc);
        });
        mockdb.create.and.callFake(function(dd) {
            // working with the current assumption that the inner pouchdbdatastore datastore return the same instance
            dd.resource.id = '1';
            return Promise.resolve(dd);
        });

        ds = createMockedDatastore(mockdb);
    });


    // get

    it('should add missing fields on get, bypassing cache', async done => {

        mockdb.fetch.and.returnValues(Promise.resolve({
            resource: {
                id: '1',
                relations: {}
            }
        }));

        const document = await ds.get('1'); // fetch from mockdb
        verifyIsIdaiFieldDocument(document);
        done();
    });


    // getRevision

    it('should add missing fields on getRevision (bypassing cache)', async done => {

        mockdb.fetchRevision.and.returnValues(Promise.resolve({
            resource: {
                id: '1',
                relations: {}
            }
        }));

        const document = await ds.getRevision('1', '1'); // fetch from mockdb
        verifyIsIdaiFieldDocument(document);
        done();
    });


    // find

    it('should add missing fields on find, bypassing cache', async done => {

        mockIndexFacade.perform.and.returnValues(['1']);
        mockdb.fetch.and.returnValues(Promise.resolve({
            resource: {
                id: '1',
                relations: {}
            }
        }));

        const documents = (await ds.find({})).documents; // fetch from mockdb
        expect(documents.length).toBe(1);
        verifyIsIdaiFieldDocument(documents[0]);
        done();
    });


    it('should add missing fields on find', async done => {

        await ds.create({resource: { // trigger caching of document
            id: '1',
            relations: {}
        }} as any, 'u');
        mockIndexFacade.perform.and.returnValues(['1']);

        const documents = (await ds.find({})).documents; // fetch from cache
        expect(documents.length).toBe(1);
        verifyIsIdaiFieldDocument(documents[0]);
        done();
    });


    it('should limit the number of documents returned on find', async done => {

        await ds.create({resource: {
            id: '1',
            relations: {}
        }} as any, 'u');

        await ds.create({resource: {
            id: '2',
            relations: {}
        }} as any, 'u');

        mockIndexFacade.perform.and.returnValues(['1', '2']);

        const { documents, totalCount } = await ds.find({ 'limit': 1 });
        expect(documents.length).toBe(1);
        expect(totalCount).toBe(2);
        verifyIsIdaiFieldDocument(documents[0]);
        done();
    });


    it('cant find one and only document', async done => {

        mockIndexFacade.perform.and.returnValues(['1']);
        mockdb.fetch.and.returnValue(Promise.reject("e"));

        const { documents, totalCount } = await ds.find({});
        expect(documents.length).toBe(0);
        expect(totalCount).toBe(0);
        done();
    });


    it('cant find second document', async done => {

        mockIndexFacade.perform.and.returnValues(['1', '2']);
        mockdb.fetch.and.returnValues(
            Promise.resolve({
                resource: {
                    id: '1',
                    relations: {}
                }
            }),
            Promise.reject("e"));

        const { documents, totalCount } = await ds.find({});
        expect(documents.length).toBe(1);
        expect(totalCount).toBe(1);
        done();
    });


    // update

    it('should add missing fields on update', async done => {

        await ds.update({resource: { // trigger caching of document
            id: '1',
            relations: {}
        }} as any, 'u');
        const document = await ds.get('1'); // fetch from cache
        verifyIsIdaiFieldDocument(document);
        done();
    });


    it('should add missing fields on update with reassign', async done => {

        await ds.update({resource: { // trigger caching of document
            id: '1',
            val: 'a',
            relations: {}
        }} as any, 'u');
        await ds.update({resource: { // trigger caching and reassigning of document
            id: '1',
            val: 'b',
            relations: {}
        }} as any, 'u');
        const document = await ds.get('1'); // fetch from cache
        expect(document.resource['val']).toEqual('b');
        verifyIsIdaiFieldDocument(document);
        done();
    });


    // create

    it('should add missing fields on create', async done => {

        await ds.create({resource: { // trigger caching of document
            id: '1',
            relations: {}
        }} as any, 'u');

        const document = await ds.get('1'); // fetch from cache
        verifyIsIdaiFieldDocument(document);
        done();
    });


    it('should return the cached instance on create', async done => {

        let doc1 = Static.doc('sd1', 'identifier1');

        await ds.create(doc1, 'u');
        try {
            const documents = (await ds.find({ q: 'sd1' })).documents; // mockdb returns other instance
            expect((documents[0]).resource['identifier']).toBe('identifier1');
            doc1.resource['shortDescription'] = 's4';
            expect((documents[0]).resource['shortDescription']).toBe('s4');
        } catch (error) {
            fail(error);
        }
        done();
    });


    // xitted

    it('should return cached instance on update', async done => {

        let doc1 = Static.doc('sd1', 'identifier1');
        let doc2;

        await ds.create(doc1, 'u');
        doc2 = Static.doc('sd1', 'identifier_');
        doc2.resource.id = '1';
        await ds.update(doc2, 'u');

        const result = await ds.find({q: 'sd1'}); // mockdb returns other instance
        expect((result.documents[0])['_rev']).toBe('2');
        expect((result.documents[0]).resource['identifier']).toBe('identifier_');
        doc2.resource['shortDescription'] = 's4';
        expect((result.documents[0]).resource['shortDescription']).toBe('s4');
        done();
    });
});