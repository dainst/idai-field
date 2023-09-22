import { ChangesStream } from '../../../src/datastore/changes/changes-stream';

/**
 * @author Thomas Kleinke
 * @author Daniel de Oliveira
 */
describe('RemoteChangesStream', () => {

    let rcs;
    let doc;
    let datastore;
    let indexFacade;
    let documentConverter;
    let documentCache;
    let getUsername;
    let fun;


    beforeEach(() => {

        doc = {
            resource: {
                id: 'id1',
                category: 'Object',
                relations: {}
            },
            created: {
                user: 'remoteuser',
                date: new Date('2018-01-01T01:00:00.00Z')
            },
            modified: [
                {
                    user: 'remoteuser',
                    date: new Date('2018-01-02T07:00:00.00Z')
                }
            ]
        };

        spyOn(console, 'warn'); // suppress console.warn

        indexFacade = jasmine.createSpyObj('MockIndexFacade', ['put', 'get', 'remove']);
        documentConverter = jasmine.createSpyObj('MockDocumentConverter', ['convert']);
        documentCache = jasmine.createSpyObj('MockDocumentCache', ['get', 'reassign']);

        getUsername = () => 'localuser';
        documentConverter.convert.and.returnValue(doc);
        indexFacade.put.and.returnValue(doc);
        documentCache.get.and.returnValue(1); // just to trigger reassignment

        datastore = jasmine.createSpyObj('MockDatastore', ['changesNotifications', 'deletedNotifications',
            'fetch', 'fetchRevision']);
        datastore.fetch.and.returnValue(Promise.resolve(doc));

        datastore.changesNotifications.and.returnValue({subscribe: (func: Function) => fun = func});
        datastore.deletedNotifications.and.returnValue({subscribe: (func: Function) => undefined});

        rcs = new ChangesStream(
            datastore,
            indexFacade,
            documentCache,
            documentConverter,
            getUsername);
    });


    it('should put to index facade and reassign to cache', async done => {

        await fun(doc);
        expect(indexFacade.put).toHaveBeenCalledWith(doc);
        expect(documentCache.reassign).toHaveBeenCalledWith(doc);
        done();
    });


    it('send through category converter', async done => {

        await fun(doc);
        expect(documentConverter.convert).toHaveBeenCalledWith(doc);
        done();
    });


    it('detect that it is remote change', async done => {

        documentConverter.convert.and.returnValue(doc);

        await fun(doc);
        expect(indexFacade.put).toHaveBeenCalledWith(doc);
        done();
    });


    it('detect that it is local change', async done => {

        doc.modified[0] = {
            user: 'localuser', // same user
            date: new Date('2018-02-08T01:00:00.00Z')
        };

        documentConverter.convert.and.returnValue(doc);

        await fun(doc);
        expect(indexFacade.put).not.toHaveBeenCalled();
        done();
    });


    it('detect remote change for conflicted document', async done => {

        const rev2 = {
            resource: {
                id: 'id1',
                category: 'Object',
                relations: {}
            },
            created: {
                user: 'remoteuser',
                date: new Date('2018-01-01T01:00:00.00Z')
            },
            modified: [
                {
                    user: 'remoteuser2',
                    date: new Date('2018-01-02T15:00:00.00Z')
                }
            ]
        };

        datastore.fetch.and.returnValue(Promise.resolve({'_conflicts': ['first'], resource: { id: '1' }}));
        datastore.fetchRevision.and.returnValue(Promise.resolve(rev2));

        documentConverter.convert.and.returnValue(doc);

        await fun(doc);
        expect(indexFacade.put).toHaveBeenCalledWith(doc);
        done();
    });


    it('always treat changes to conflicted documents as remote changes', async done => {

        const rev2 = {
            resource: {
                id: 'id1',
                category: 'Object',
                relations: {}
            },
            created: {
                user: 'remoteuser',
                date: new Date('2018-01-01T01:00:00.00Z')
            },
            modified: [
                {
                    user: 'localuser',
                    date: new Date('2018-01-02T15:00:00.00Z')
                }
            ]
        };

        datastore.fetch.and.returnValue(Promise.resolve({'_conflicts': ['first'], resource: { id: '1' }}));
        datastore.fetchRevision.and.returnValue(Promise.resolve(rev2));

        documentConverter.convert.and.returnValue(doc);

        await fun(doc);
        expect(indexFacade.put).toHaveBeenCalled();
        done();
    });
});
