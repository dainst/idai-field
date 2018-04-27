/**
 * @author Daniel de Oliveira
 */
import {RemoteChangesStream} from '../../../../app/core/datastore/core/remote-changes-stream';
import {Static} from '../../static';

describe('RemoteChangesStream', () => {

    let rcs;
    let doc;
    let datastore;
    let indexFacade;
    let typeConverter;
    let documentCache;
    let settingsService;
    let fun;

    beforeEach(() => {

        doc = Static.doc('sd1', 'ident1', 'type1', 'id1');

        indexFacade = jasmine.createSpyObj('MockIndexFacade', ['put', 'get', 'remove']);
        typeConverter = jasmine.createSpyObj('MockTypeConverter', ['convert']);
        documentCache = jasmine.createSpyObj('MockTypeConverter', ['get', 'reassign']);
        settingsService = jasmine.createSpyObj('MockSettingsService', ['getUsername']);

        settingsService.getUsername.and.returnValue('localuser');
        typeConverter.convert.and.returnValue(doc);
        indexFacade.put.and.returnValue(doc);
        documentCache.get.and.returnValue(1); // just to trigger reassignment

        datastore = jasmine.createSpyObj('MockDatastore', ['remoteChangesNotifications', 'remoteDeletedNotifications', 'fetchConflictedRevisions']);
        datastore.fetchConflictedRevisions.and.returnValue(Promise.resolve([]));

        datastore.remoteChangesNotifications.and.returnValue({subscribe: (func: Function) => fun = func});
        datastore.remoteDeletedNotifications.and.returnValue({subscribe: (func: Function) => undefined});

        rcs = new RemoteChangesStream(
            datastore,
            indexFacade,
            documentCache,
            typeConverter,
            settingsService);
    });


    it('should put to index facade and reassign to cache', async done => {

        fun(doc).then(() => {
            expect(indexFacade.put).toHaveBeenCalledWith(doc);
            expect(documentCache.reassign).toHaveBeenCalledWith(doc);
            done();
        });
    });


    it('send through type converter', async done => {

        fun(doc).then(() => {
            expect(typeConverter.convert).toHaveBeenCalledWith(doc);
            done();
        });
    });
});