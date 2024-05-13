import { ChangesStream } from '../../../src/datastore/changes/changes-stream';
import { Document } from '../../../src/model';


/**
 * @author Thomas Kleinke
 * @author Daniel de Oliveira
 */
describe('ChangesStream', () => {

    let rcs;
    let doc;
    let pouchdbDatastore;
    let datastore;
    let indexFacade;
    let documentConverter;
    let documentCache;
    let projectConfiguration;
    let getUsername;
    let onChange;


    beforeEach(() => {

        doc = {
            resource: {
                id: 'id1',
                identifier: '1',
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

        indexFacade = jasmine.createSpyObj('MockIndexFacade',
            ['put', 'putToSingleIndex', 'get', 'remove', 'getCount', 'notifyObservers']);
        documentConverter = jasmine.createSpyObj('MockDocumentConverter', ['convert']);
        documentCache = jasmine.createSpyObj('MockDocumentCache', ['get', 'reassign']);

        getUsername = () => 'localuser';
        documentConverter.convert.and.returnValue(doc);
        indexFacade.getCount.and.returnValue(0);
        documentCache.get.and.returnValue({ resource: { id: '1', identifier: '1' } });

        pouchdbDatastore = jasmine.createSpyObj('MockPouchdbDatastore',
            ['changesNotifications', 'deletedNotifications', 'fetch', 'fetchRevision']);
        pouchdbDatastore.fetch.and.returnValue(Promise.resolve(doc));

        pouchdbDatastore.changesNotifications.and.returnValue({ subscribe: (func: Function) => onChange = func });
        pouchdbDatastore.deletedNotifications.and.returnValue({ subscribe: (func: Function) => undefined });

        datastore = jasmine.createSpyObj('MockDatastore', ['find'])
        datastore.find.and.returnValue(Promise.resolve({ documents: [] }));

        projectConfiguration = jasmine.createSpyObj(['MockProjectConfiguration'],
            ['getCategory', 'getRegularCategories', 'getCategoryWithSubcategories']);
        projectConfiguration.getCategory.and.returnValue({ name: 'Object', groups: [] });
        projectConfiguration.getRegularCategories.and.returnValue([]);
        projectConfiguration.getCategoryWithSubcategories.and.returnValue([{ name: 'Object', groups: [] }]);

        rcs = new ChangesStream(
            pouchdbDatastore,
            datastore,
            indexFacade,
            documentCache,
            documentConverter,
            projectConfiguration,
            getUsername);
    });


    it('should put to index facade and reassign to cache', async done => {

        await onChange(doc);
        expect(indexFacade.put).toHaveBeenCalledWith(doc);
        expect(documentCache.reassign).toHaveBeenCalledWith(doc);
        done();
    });


    it('send through category converter', async done => {

        await onChange(doc);
        expect(documentConverter.convert).toHaveBeenCalledWith(doc);
        done();
    });


    it('detect that it is remote change', async done => {

        documentConverter.convert.and.returnValue(doc);

        await onChange(doc);
        expect(indexFacade.put).toHaveBeenCalledWith(doc);
        done();
    });


    it('detect that it is local change', async done => {

        doc.modified[0] = {
            user: 'localuser', // same user
            date: new Date('2018-02-08T01:00:00.00Z')
        };

        documentConverter.convert.and.returnValue(doc);

        await onChange(doc);
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

        pouchdbDatastore.fetch.and.returnValue(Promise.resolve({'_conflicts': ['first'], resource: { id: '1' }}));
        pouchdbDatastore.fetchRevision.and.returnValue(Promise.resolve(rev2));

        documentConverter.convert.and.returnValue(doc);

        await onChange(doc);
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

        pouchdbDatastore.fetch.and.returnValue(Promise.resolve({'_conflicts': ['first'], resource: { id: '1' }}));
        pouchdbDatastore.fetchRevision.and.returnValue(Promise.resolve(rev2));

        documentConverter.convert.and.returnValue(doc);

        await onChange(doc);
        expect(indexFacade.put).toHaveBeenCalled();
        done();
    });


    it('update non-unique identifier warnings', async done => {

        let doc2: Document = {
            resource: {
                id: 'id2', identifier: '1', category: 'Object', relations: {}
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
        } as Document;

        indexFacade.getCount.and.returnValue(2);
        datastore.find.and.returnValue(Promise.resolve({ documents: [doc2] }));
        documentCache.reassign.and.callFake(document => {
            document.id === 'id1' ? doc = document : doc2 = document;
        });

        await onChange(doc);
        expect(doc.warnings.nonUniqueIdentifier).toBe(true);
        expect(doc2.warnings.nonUniqueIdentifier).toBe(true);

        doc2.resource.identifier = '2';
        documentCache.get.and.returnValue({ resource: { id: 'id2', identifier: '1' } });
        indexFacade.getCount.and.returnValue(1);
        datastore.find.and.returnValue(Promise.resolve({ documents: [doc] }));

        await onChange(doc2);
        expect(doc.warnings).toBeUndefined();
        expect(doc2.warnings).toBeUndefined();

        done();
    });
});
