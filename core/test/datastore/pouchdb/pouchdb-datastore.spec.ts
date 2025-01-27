import { DatastoreErrors } from '../../../src/datastore/datastore-errors';
import { PouchdbDatastore } from '../../../src/datastore/pouchdb/pouchdb-datastore';
import { Document } from '../../../src/model/document/document';
import { doc } from '../../test-helpers';


/**
 * @author Daniel de Oliveira
 * @author Sebastian Cuy
 * @author Thomas Kleinke
 */
describe('PouchdbDatastore', () => {

    let datastore: PouchdbDatastore;
    let pouchdbProxy: any;
    let res;


    beforeEach(() => {

        let idGenerator = jasmine.createSpyObj('idGenerator', ['generateId']);
        idGenerator.generateId.and.returnValues(1, 2);

        pouchdbProxy = jasmine.createSpyObj('pouchdbProxy',
            ['get', 'put', 'bulkDocs', 'remove', 'allDocs']);
        pouchdbProxy.put.and.callFake(async doc => res = doc);
        pouchdbProxy.get.and.callFake(async () => res);
        pouchdbProxy.remove.and.returnValue(Promise.resolve(undefined));
        pouchdbProxy.bulkDocs.and.callFake(async documents => res = documents);
        pouchdbProxy.allDocs.and.callFake(() => Promise.resolve({
            rows: res ? res.map(document => { return { doc: document }; }) : []
        }));

        datastore = new PouchdbDatastore(
            _ => pouchdbProxy,
            idGenerator);
        datastore.createDbForTesting('test');
    });


    it('create: create an id', async done => {

        try {
            const result = await datastore.create(doc('sd1'), 'u');
            expect(result.resource.id).toBe(1 as any);
        } catch (e) {
            fail(e);
        }
        done();
    });


    it('create: should create a document and take the existing resource.id', async done => {

        let called = false;
        pouchdbProxy.get.and.callFake(async doc => {
            if (!called) {
                called = true;
                throw undefined;
            }
            return {
                resource: {
                    id: doc, category: 'some', relations: []},
                created: {date:'2011/01/01'},
                modified: [{date:'2011/01/01'}]
            };
        });

        const docToCreate: Document = doc('sd1');
        docToCreate.resource.id = 'a1';

        await datastore.create(docToCreate, 'u');
        // this step was added to address a problem where a document
        // with an existing resource.id was stored but could not
        // get refreshed later
        await datastore.fetch(docToCreate.resource.id);
        // and the same may occur on get
        try {
            const createdDoc = await datastore.fetch(docToCreate.resource.id) as Document;
            expect(createdDoc.resource.id).toBe('a1');
        } catch (e) {
            fail(e);
        }
        done();
    });


    it('create: should not create a document with the resource.id of an already existing doc', async done => {

        const docToCreate1: Document = doc('sd1');
        docToCreate1.resource.id = 'a1';
        const docToCreate2: Document = doc('sd1');
        docToCreate2.resource.id = 'a1';

        try {
            await datastore.create(docToCreate1, 'u');
            await datastore.create(docToCreate2, 'u');
            fail();
        } catch (expected) {
            expect(expected[0]).toEqual(DatastoreErrors.DOCUMENT_RESOURCE_ID_EXISTS);
        }
        done();
    });


    it('create: create dates', async done => {

        const newDoc = doc('sd1');
        delete newDoc.created;

        const result = await datastore.create(newDoc, 'u');
        expect(result.created.user).toEqual('u');
        expect(result.created.date instanceof Date).toBeTruthy();
        expect(Array.isArray(result.modified)).toBeTruthy();
        expect(result.modified.length).toBe(0);
        done();
    });


    it('bulkCreate: create ids', async done => {

        try {
            const result = await datastore.bulkCreate(
                [doc('sd1'), doc('sd2')], 'u'
            );
            expect(result[0].resource.id).toBe(1 as any);
            expect(result[1].resource.id).toBe(2 as any);
        } catch (e) {
            fail(e);
        }
        done();
    });


    it('bulkCreate: should not create a document with the resource.id of an already existing doc', async done => {

        const docToCreate1: Document = doc('sd1');
        docToCreate1.resource.id = 'a1';
        const docToCreate2: Document = doc('sd1');
        docToCreate2.resource.id = 'a1';

        try {
            await datastore.bulkCreate([docToCreate1], 'u');
            await datastore.bulkCreate([docToCreate2], 'u');
            fail();
        } catch (expected) {
            expect(expected[0]).toEqual(DatastoreErrors.DOCUMENT_RESOURCE_ID_EXISTS);
        }
        done();
    });


    it('update: should update an existing document with no identifier conflict', async done => {

        let doc2 = doc('id2');
        await datastore.create(doc('id1'), 'u');
        doc2 = await datastore.create(doc2, 'u');
        await datastore.update(doc2, 'u');
        done();
    });


    it('update: should not update if resource id not present', async done => {

        try {
            await datastore.update(doc('sd1'), 'u');
            fail();
        } catch (expected) {
            expect(expected[0]).toBe(DatastoreErrors.DOCUMENT_NO_RESOURCE_ID);
        }
        done();
    });


    it('update: should not update if created not present', async done => {

        const newDoc = doc('sd1');
        newDoc.resource.id = '1';
        delete newDoc.created;

        try {
            await datastore.update(newDoc, 'u');
            fail();
        } catch (expected) {
            expect(expected[0]).toBe(DatastoreErrors.INVALID_DOCUMENT);
        }
        done();
    });


    it('update: should not update if not existent', async done => {

        pouchdbProxy.get.and.returnValue(Promise.reject(undefined));

        try {
            await datastore.update(doc('sd1', 'identifier1', 'Find', 'id1'), 'u');
            fail();
        } catch (expectedErr) {
            expect(expectedErr[0]).toBe(DatastoreErrors.DOCUMENT_NOT_FOUND);
        }
        done();
    });


    it('update: should squash old revisions', async done => {

        const newDoc = doc('sd1');
        newDoc.resource.id = '1';

        const rev = doc('sd1');
        rev['_rev'] = 'r-1';

        try {
            await datastore.update(newDoc, 'u3', ['r-1']);
            expect(pouchdbProxy.remove).toHaveBeenCalledWith('1', 'r-1');

        } catch (e) {
            fail(e);
        }

        done();
    });


    it('update: should merge modified dates of squash revisions', async done => {

        const newDoc = doc('sd1');
        newDoc.resource.id = '1';

        let i = 0;
        pouchdbProxy.get.and.callFake(async (resourceId: string, params?: any) => {
            if (params && params.rev) {
                const rev = doc('sd1');
                rev.modified[0] = { user: 'u2', date: new Date('2018-04-27T11:07:05.760Z') };
                rev.created = rev.modified[0];
                rev.resource.id = '1';
                rev['_rev'] = 'r-1';
                return rev;
            } else if (i === 0) {
                i = i + 1;
                const existingDoc = doc('sd1');
                existingDoc.created = { user: 'u1', date: new Date('2018-04-26T11:07:05.760Z') };
                existingDoc.modified = [];
                existingDoc.resource.id = '1';
                return existingDoc;
            } else {
                return res;
            }
        });

        const result = await datastore.update(newDoc, 'u3', ['r-1']);

        expect(result.created.user).toEqual('u1');
        expect(result.modified.length).toBe(2);
        expect(result.modified[0].user).toEqual('u2');
        expect(result.modified[1].user).toEqual('u3');
        done();
    });


    it('update: add modified date', async done => {

        const newDoc = doc('id2');
        newDoc.resource.id = '1';

        let i = 0;
        pouchdbProxy.get.and.callFake(async () => {
            if (i === 0) {
                i = i + 1;
                const existingDoc = doc('sd1');
                existingDoc.created = { user: 'u1', date: new Date('2018-04-26T11:07:05.760Z') };
                existingDoc.modified = [];
                existingDoc.resource.id = '1';
                return existingDoc;
            } else {
                return res;
            }
        });

        const result = await datastore.update(newDoc, 'u');
        expect(result.modified.length).toBe(1);
        expect(result.modified[0].user).toEqual('u');
        expect(result.modified[0].date instanceof Date).toBeTruthy();
        done();
    });


    it('bulkUpdate: should not update if resource id not present', async done => {

        try {
            await datastore.bulkUpdate([doc('sd1')], 'u');
            fail();
        } catch (expected) {
            expect(expected[0]).toBe(DatastoreErrors.DOCUMENT_NO_RESOURCE_ID);
        }
        done();
    });


    it('get: should get if existent', async done => {

        pouchdbProxy.get.and.callFake(async resourceId => {
            return {resource: {
                id: resourceId, category: 'some', relations: []}, created: { date:'2011/01/01' },
                modified: [{ date:'2011/01/01' }]
            };
        });

        try {
            const result = await datastore.fetch('id5');
            expect(result.resource.id).toBe('id5');
        } catch (e) {
            fail(e);
        }
        done();
    });


    it('get: should reject with keyOfM in when trying to get a non existing document', async done => {

        pouchdbProxy.get.and.returnValue(Promise.reject(undefined));

        try {
            await datastore.fetch('nonexisting');
            fail();
        } catch (expected) {
            expect(expected[0]).toEqual(DatastoreErrors.DOCUMENT_NOT_FOUND);
        }
        done();
    });


    it('remove: should remove if existent', async (done) => {

        await datastore.remove(doc('sd1', 'identifier1', 'Find', 'id1'));
        expect(pouchdbProxy.remove).toHaveBeenCalled();
        done();
    });


    it('remove: should throw when no resource id', async done => {

        try {
            await datastore.remove(doc('sd2'));
            fail();
        } catch (expected) {
            expect(expected[0]).toEqual(DatastoreErrors.DOCUMENT_NO_RESOURCE_ID);
        }
        done();
    });


    it('remove: should throw when trying to remove and not existent', async done => {

        pouchdbProxy.get.and.returnValue(Promise.reject(undefined));

        const d = doc('sd1');
        d['resource']['id'] = 'hoax';
        try {
            await datastore.remove(d);
            fail();
        } catch (expected) {
            expect(expected[0]).toEqual(DatastoreErrors.DOCUMENT_NOT_FOUND);
        }
        done();
    });


    it('remove: remove all conflicting revisions', async done => {

        const document = doc('shortDescription1', 'identifier1', 'Find', 'id1');
        document['_conflicts'] = ['revision1', 'revision2'];

        pouchdbProxy.get.and.returnValue(Promise.resolve(document));

        await datastore.remove(document);
        expect(pouchdbProxy.remove).toHaveBeenCalledWith(document);
        expect(pouchdbProxy.remove).toHaveBeenCalledWith('id1', 'revision1');
        expect(pouchdbProxy.remove).toHaveBeenCalledWith('id1', 'revision2');
        done();
    });
});
