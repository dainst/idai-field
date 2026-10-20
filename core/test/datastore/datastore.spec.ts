import { Datastore } from '../../src/datastore/datastore';
import { DocumentCache } from '../../src/datastore/document-cache';
import { ProjectConfiguration } from '../../src/services/project-configuration';
import { createCategory, doc } from '../test-helpers';


/**
 * @author Daniel de Oliveira
 * @author Thomas Kleinke
 */
describe('Datastore', () => {

    let datastore: Datastore;
    let mockdb: any;
    let mockIndexFacade: any;


    function createMockedDatastore(mockdb: any) {

        const forms = [createCategory('Find')];

        const projectConfiguration = new ProjectConfiguration({
            forms, categories: {}, relations: [], commonFields: {}, valuelists: {}, projectLanguages: []
        });

        const documentCache = new DocumentCache();

        return new Datastore(
            mockdb,
            mockIndexFacade,
            documentCache,
            projectConfiguration,
            () => 'username'
        );
    }


    function verifyIsDocument(document) {

        expect(document.resource.id).toBeDefined();
    }


    beforeEach(() => {

        mockdb = jasmine.createSpyObj('mockdb',
            ['create', 'update', 'fetch', 'bulkFetch', 'fetchRevision']);
        mockdb.create.and.callFake(function(document) {
                return Promise.resolve(document);
            });
        mockdb.update.and.callFake(function(document) {
            // working with the current assumption that the inner pouchdbdatastore datastore returns the same instance
            document.resource.id = '1';
            document['_rev'] = '2';
            return Promise.resolve(document);
        });
        mockdb.bulkFetch.and.returnValue(new Promise(resolve => resolve([])));

        mockIndexFacade = jasmine.createSpyObj('mockIndexFacade',
            ['find', 'put', 'remove', 'getCount', 'putToSingleIndex', 'notifyObservers']);
        mockIndexFacade.find.and.callFake(() => ['1']);
        mockIndexFacade.put.and.callFake(function(document) {
            return Promise.resolve(document);
        });
        mockIndexFacade.getCount.and.returnValue(0);

        datastore = createMockedDatastore(mockdb);
    });


    // get

    it('should add missing fields on get, bypassing cache', async () => {

        mockdb.fetch.and.returnValue(Promise.resolve({
            resource: {
                id: '1',
                category: 'Find',
                relations: {}
            }
        }));

        const document = await datastore.get('1'); // fetch from mockdb
        verifyIsDocument(document);
    });


    // get multiple

    it('should add missing fields on getMultiple, bypassing cache', async () => {

        mockdb.bulkFetch.and.returnValue(Promise.resolve([
            {
                resource: {
                    id: '1',
                    category: 'Find',
                    relations: {}
                }
            }, {
                resource: {
                    id: '2',
                    category: 'Find',
                    relations: {}
                }
            }
        ]));

        const documents = await datastore.getMultiple(['1', '2']);
        expect(documents.length).toBe(2);
        verifyIsDocument(documents[0]);
        verifyIsDocument(documents[1]);
    });


    it('should retain order when fetching documents from both cache and datastore on getMultiple', async () => {

        mockdb.fetch.and.returnValue(Promise.resolve({
            resource: {
                id: '2',
                category: 'Find',
                relations: {}
            }
        }));

        mockdb.bulkFetch.and.returnValue(Promise.resolve([
            {
                resource: {
                    id: '1',
                    category: 'Find',
                    relations: {}
                }
            }, {
                resource: {
                    id: '3',
                    category: 'Find',
                    relations: {}
                }
            }
        ]));

        await datastore.get('2');  // Save in cache

        const documents = await datastore.getMultiple(['1', '2', '3']);
        expect(documents.length).toBe(3);
        expect(documents[0].resource.id).toEqual('1');
        expect(documents[1].resource.id).toEqual('2');
        expect(documents[2].resource.id).toEqual('3');
    });


    // getRevision

    it('should add missing fields on getRevision (bypassing cache)', async () => {

        mockdb.fetchRevision.and.returnValue(Promise.resolve({
            resource: {
                id: '1',
                category: 'Find',
                relations: {}
            }
        }));

        const document = await datastore.getRevision('1', '1'); // fetch from mockdb
        verifyIsDocument(document);
    });


    // find

    it('should add missing fields on find, bypassing cache', async () => {

        mockIndexFacade.find.and.returnValue(['1']);
        mockdb.bulkFetch.and.returnValue(Promise.resolve([
            {
                resource: {
                    id: '1',
                    category: 'Find',
                    relations: {}
                }
            }
        ]));

        const documents = (await datastore.find({})).documents; // fetch from mockdb
        expect(documents.length).toBe(1);
        verifyIsDocument(documents[0]);
    });


    it('should add missing fields on find', async () => {

        await datastore.create({
            resource: { // trigger caching of document
                id: '1',
                category: 'Find',
                relations: {}
            }
        } as any);
        mockIndexFacade.find.and.returnValue(['1']);

        const documents = (await datastore.find({})).documents; // fetch from cache
        expect(documents.length).toBe(1);
        verifyIsDocument(documents[0]);
    });


    it('should limit the number of documents returned on find', async () => {

        await datastore.create({ resource: { id: '1', category: 'Find', relations: {} } } as any);
        await datastore.create({ resource: { id: '2', category: 'Find', relations: {} } } as any);

        mockIndexFacade.find.and.returnValue(['1', '2']);

        const { documents, totalCount } = await datastore.find({ limit: 1 });
        expect(documents.length).toBe(1);
        expect(totalCount).toBe(2);
        verifyIsDocument(documents[0]);
    });


    it('limit the number of documents and use an offset', async () => {

        await datastore.create({ resource: { id: '1', category: 'Find', relations: {} } } as any);
        await datastore.create({ resource: { id: '2', category: 'Find', relations: {} } } as any);
        await datastore.create({ resource: { id: '3', category: 'Find', relations: {} } } as any);

        mockIndexFacade.find.and.returnValue(['3','1','2']);

        const { documents, totalCount } = await datastore.find({ limit: 1, offset: 1 });
        expect(documents.length).toBe(1);
        expect(totalCount).toBe(3);
        verifyIsDocument(documents[0]);

        expect(documents[0].resource.id).toBe('1');
    });


    it('offset excludes everything', async () => {

        await datastore.create({ resource: { id: '1', category: 'Find', relations: {} } } as any);
        await datastore.create({ resource: { id: '2', category: 'Find', relations: {} } } as any);
        await datastore.create({ resource: { id: '3', category: 'Find', relations: {} } } as any);

        mockIndexFacade.find.and.returnValue([
            { id: '1', identifier: 'eins' },
            { id: '2', identifier: 'zwei' },
            { id: '3', identifier: 'drei' }
        ]);

        const { documents, totalCount } = await datastore.find({ offset: 3 });
        expect(documents.length).toBe(0);
        expect(totalCount).toBe(3);
    });


    it('cant find one and only document', async () => {

        mockIndexFacade.find.and.returnValue(['1']);
        mockdb.bulkFetch.and.returnValue(Promise.resolve([]));

        const { documents, totalCount } = await datastore.find({});
        expect(documents.length).toBe(0);
        expect(totalCount).toBe(0);
    });


    it('cant find second document', async () => {

        mockIndexFacade.find.and.returnValue(['1', '2']);

        mockdb.bulkFetch.and.returnValues(
            Promise.resolve([
                {
                    resource: {
                        id: '1',
                        category: 'Find',
                        relations: {}
                    }
                }
            ]),
            Promise.resolve([]),
            Promise.resolve([]),
            Promise.resolve([]),
            Promise.resolve([])
        );

        const { documents, totalCount } = await datastore.find({});
        expect(documents.length).toBe(1);
        expect(totalCount).toBe(1);
    });


    // find ids

    it('should return only ids', async () => {

        await datastore.create({ resource: { id: '1', category: 'Find', relations: {} } } as any);
        await datastore.create({ resource: { id: '2', category: 'Find', relations: {} } } as any);

        mockIndexFacade.find.and.returnValue(['1', '2']);

        const result = datastore.findIds({});
        expect(result.ids.length).toBe(2);
        expect(result.totalCount).toBe(2);
        expect(result['documents']).toBe(undefined);
    });


    // update

    it('should add missing fields on update', async () => {

        await datastore.update({ resource: { // trigger caching of document
            id: '1',
            category: 'Find',
            relations: {}
        } } as any);
        const document = await datastore.get('1'); // fetch from cache
        verifyIsDocument(document);
    });


    it('should add missing fields on update with reassign', async () => {

        await datastore.update({ resource: { // trigger caching of document
            id: '1',
            category: 'Find',
            val: 'a',
            relations: {}
        } } as any);
        await datastore.update({ resource: { // trigger caching and reassigning of document
            id: '1',
            category: 'Find',
            val: 'b',
            relations: {}
        } } as any);
        const document = await datastore.get('1'); // fetch from cache
        expect(document.resource['val']).toEqual('b');
        verifyIsDocument(document);
    });


    // create

    it('should add missing fields on create', async () => {

        await datastore.create({ resource: { // trigger caching of document
            id: '1',
            category: 'Find',
            relations: {}
        } } as any);

        const document = await datastore.get('1'); // fetch from cache
        verifyIsDocument(document);
    });


    it('should return the cached instance on create', async () => {

        let document1 = doc('sd1', 'identifier1');

        mockdb.create.and.callFake(function(document) {
            // working with the current assumption that the inner pouchdbdatastore datastore returns the same instance
            document.resource.id = '1';
            return Promise.resolve(document);
        });

        await datastore.create(document1);
        try {
            const documents = (await datastore.find({ q: 'sd1' })).documents; // mockdb returns other instance
            expect((documents[0]).resource['identifier']).toBe('identifier1');
            document1.resource['shortDescription'] = 's4';
            expect((documents[0]).resource['shortDescription']).toBe('s4');
        } catch (error) {
            fail(error);
        }
    });


    it('should return cached instance on update', async () => {

        let document1 = doc('sd1', 'identifier1');
        let document2;

        await datastore.create(document1);
        document2 = doc('sd1', 'identifier_');
        document2.resource.id = '1';
        await datastore.update(document2);

        const result = await datastore.find({ q: 'sd1' }); // mockdb returns other instance
        expect((result.documents[0])['_rev']).toBe('2');
        expect((result.documents[0]).resource['identifier']).toBe('identifier_');
        document2.resource['shortDescription'] = 's4';
        expect((result.documents[0]).resource['shortDescription']).toBe('s4');
    });
});
