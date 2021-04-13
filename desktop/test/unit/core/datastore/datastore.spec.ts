import { doc, DocumentCache, Datastore } from 'idai-field-core';
import { FieldConverter } from '../../../../src/app/core/datastore/field/category-converter';


/**
 * @author Daniel de Oliveira
 * @author Thomas Kleinke
 */
describe('Datastore', () => {

    let ds: Datastore;
    let mockdb: any;
    let mockIndexFacade: any;

    function createMockedDatastore(mockdb: any) {

        const mockProjectCategories = jasmine.createSpyObj('mockProjectCategories', ['getFieldCategoryNames']);
        const mockProjectConfiguration = jasmine.createSpyObj('mockProjectConfiguration', ['isSubcategory', 'getCategoryTreelist']);
        mockProjectConfiguration.isSubcategory.and.returnValue(false);
        mockProjectCategories.getFieldCategoryNames.and.returnValue(['Find']);
        mockProjectConfiguration.getCategoryTreelist.and.returnValue(
            [
                {
                    item: { name: 'Find' },
                    trees: []
                }
            ]
        );

        const documentCache = new DocumentCache();
        return new Datastore(
            mockdb,
            mockIndexFacade,
            documentCache,
            new FieldConverter(mockProjectConfiguration));
    }


    function verifyIsDocument(document) {

        expect(document.resource.identifier).toEqual('');
    }


    beforeEach(() => {

        mockdb = jasmine.createSpyObj('mockdb',
                ['create', 'update', 'fetch', 'bulkFetch', 'fetchRevision']);
        mockIndexFacade = jasmine.createSpyObj('mockIndexFacade',
            ['find', 'put', 'remove']);

        mockdb.update.and.callFake(function(dd) {
            // working with the current assumption that the inner pouchdbdatastore datastore return the same instance
            dd.resource.id = '1';
            dd['_rev'] = '2';
            return Promise.resolve(dd);
        });
        mockIndexFacade.find.and.callFake(function() {
            const d = doc('sd1');
            d.resource.id = '1';
            return ['1'];
        });
        mockIndexFacade.put.and.callFake(function(doc) {
            return Promise.resolve(doc);
        });
        mockdb.create.and.callFake(function(dd) {
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
        verifyIsDocument(document);
        done();
    });


    // get multiple

    it('should add missing fields on getMultiple, bypassing cache', async done => {

        mockdb.bulkFetch.and.returnValues(Promise.resolve([
            {
                resource: {
                    id: '1',
                    relations: {}
                }
            }, {
                resource: {
                    id: '2',
                    relations: {}
                }
            }
        ]));

        const documents = await ds.getMultiple(['1', '2']);
        expect(documents.length).toBe(2);
        verifyIsDocument(documents[0]);
        verifyIsDocument(documents[1]);
        done();
    });


    it('should retain order when fetching documents from both cache and datastore on getMultiple',
            async done => {

        mockdb.fetch.and.returnValues(Promise.resolve({
            resource: {
                id: '2',
                relations: {}
            }
        }));

        mockdb.bulkFetch.and.returnValues(Promise.resolve([
            {
                resource: {
                    id: '1',
                    relations: {}
                }
            }, {
                resource: {
                    id: '3',
                    relations: {}
                }
            }
        ]));

        await ds.get('2');  // Save in cache

        const documents = await ds.getMultiple(['1', '2', '3']);
        expect(documents.length).toBe(3);
        expect(documents[0].resource.id).toEqual('1');
        expect(documents[1].resource.id).toEqual('2');
        expect(documents[2].resource.id).toEqual('3');
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
        verifyIsDocument(document);
        done();
    });


    // find

    it('should add missing fields on find, bypassing cache', async done => {

        mockIndexFacade.find.and.returnValues(['1']);
        mockdb.bulkFetch.and.returnValues(Promise.resolve([
             {
                resource: {
                    id: '1',
                    relations: {}
                }
            }
        ]));

        const documents = (await ds.find({})).documents; // fetch from mockdb
        expect(documents.length).toBe(1);
        verifyIsDocument(documents[0]);
        done();
    });


    it('should add missing fields on find', async done => {

        await ds.create({ resource: { // trigger caching of document
            id: '1',
            relations: {}
        } } as any, 'u');
        mockIndexFacade.find.and.returnValues(['1']);

        const documents = (await ds.find({})).documents; // fetch from cache
        expect(documents.length).toBe(1);
        verifyIsDocument(documents[0]);
        done();
    });


    it('should limit the number of documents returned on find', async done => {

        await ds.create({ resource: { id: '1', relations: {}} } as any, 'u');
        await ds.create({ resource: { id: '2', relations: {}} } as any, 'u');

        mockIndexFacade.find.and.returnValues(['1', '2']);

        const { documents, totalCount } = await ds.find({ limit: 1 });
        expect(documents.length).toBe(1);
        expect(totalCount).toBe(2);
        verifyIsDocument(documents[0]);
        done();
    });


    it('limit the number of documents and use an offset', async done => {

        await ds.create({ resource: { id: '1', relations: {} } } as any, 'u');
        await ds.create({ resource: { id: '2', relations: {} } } as any, 'u');
        await ds.create({ resource: { id: '3', relations: {} } } as any, 'u');

        mockIndexFacade.find.and.returnValues(['3','1','2']);

        const { documents, totalCount } = await ds.find({ limit: 1, offset: 1 });
        expect(documents.length).toBe(1);
        expect(totalCount).toBe(3);
        verifyIsDocument(documents[0]);

        expect(documents[0].resource.id).toBe('1');
        done();
    });


    it('offset excludes everything', async done => {

        await ds.create({ resource: { id: '1', relations: {} } } as any, 'u');
        await ds.create({ resource: { id: '2', relations: {} } } as any, 'u');
        await ds.create({ resource: { id: '3', relations: {} } } as any, 'u');

        mockIndexFacade.find.and.returnValues([
            { id: '1', identifier: 'eins' },
            { id: '2', identifier: 'zwei' },
            { id: '3', identifier: 'drei' }
        ]);

        const { documents, totalCount } = await ds.find({ offset: 3 });
        expect(documents.length).toBe(0);
        expect(totalCount).toBe(3);
        done();
    });


    it('cant find one and only document', async done => {

        mockIndexFacade.find.and.returnValues(['1']);
        mockdb.bulkFetch.and.returnValues(Promise.resolve([]));

        const { documents, totalCount } = await ds.find({});
        expect(documents.length).toBe(0);
        expect(totalCount).toBe(0);
        done();
    });


    it('cant find second document', async done => {

        mockIndexFacade.find.and.returnValues(['1', '2']);

        mockdb.bulkFetch.and.returnValues(Promise.resolve([
            {
                resource: {
                    id: '1',
                    relations: {}
                }
            }
        ]));

        const { documents, totalCount } = await ds.find({});
        expect(documents.length).toBe(1);
        expect(totalCount).toBe(1);
        done();
    });


    // find ids

    it('should return only ids', async done => {

        await ds.create({ resource: { id: '1', relations: {}} } as any, 'u');
        await ds.create({ resource: { id: '2', relations: {}} } as any, 'u');

        mockIndexFacade.find.and.returnValues(['1', '2']);

        const result = ds.findIds({});
        expect(result.ids.length).toBe(2);
        expect(result.totalCount).toBe(2);
        expect(result['documents']).toBe(undefined);

        done();
    });


    // update

    it('should add missing fields on update', async done => {

        await ds.update({ resource: { // trigger caching of document
            id: '1',
            relations: {}
        } } as any, 'u');
        const document = await ds.get('1'); // fetch from cache
        verifyIsDocument(document);
        done();
    });


    it('should add missing fields on update with reassign', async done => {

        await ds.update({ resource: { // trigger caching of document
            id: '1',
            val: 'a',
            relations: {}
        } } as any, 'u');
        await ds.update({ resource: { // trigger caching and reassigning of document
            id: '1',
            val: 'b',
            relations: {}
        } } as any, 'u');
        const document = await ds.get('1'); // fetch from cache
        expect(document.resource['val']).toEqual('b');
        verifyIsDocument(document);
        done();
    });


    // create

    it('should add missing fields on create', async done => {

        await ds.create({ resource: { // trigger caching of document
            id: '1',
            relations: {}
        } } as any, 'u');

        const document = await ds.get('1'); // fetch from cache
        verifyIsDocument(document);
        done();
    });


    it('should return the cached instance on create', async done => {

        let doc1 = doc('sd1', 'identifier1');

        mockdb.create.and.callFake(function(dd) {
            // working with the current assumption that the inner pouchdbdatastore datastore returns the same instance
            dd.resource.id = '1';
            return Promise.resolve(dd);
        });

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


    it('should return cached instance on update', async done => {

        let doc1 = doc('sd1', 'identifier1');
        let doc2;

        await ds.create(doc1, 'u');
        doc2 = doc('sd1', 'identifier_');
        doc2.resource.id = '1';
        await ds.update(doc2, 'u');

        const result = await ds.find({ q: 'sd1' }); // mockdb returns other instance
        expect((result.documents[0])['_rev']).toBe('2');
        expect((result.documents[0]).resource['identifier']).toBe('identifier_');
        doc2.resource['shortDescription'] = 's4';
        expect((result.documents[0]).resource['shortDescription']).toBe('s4');
        done();
    });
});
