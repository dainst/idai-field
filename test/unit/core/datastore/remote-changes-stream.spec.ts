import {RemoteChangesStream} from '../../../../app/core/datastore/core/remote-changes-stream';
import {Static} from '../../static';

/**
 * @author Daniel de Oliveira
 */
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

        spyOn(console, 'warn'); // suppress console.warn

        doc = Static.doc('sd1', 'ident1', 'type1', 'id1');

        indexFacade = jasmine.createSpyObj('MockIndexFacade', ['put', 'get', 'remove']);
        typeConverter = jasmine.createSpyObj('MockTypeConverter', ['convert']);
        documentCache = jasmine.createSpyObj('MockTypeConverter', ['get', 'reassign']);
        settingsService = jasmine.createSpyObj('MockSettingsService', ['getUsername']);

        settingsService.getUsername.and.returnValue('localuser');
        typeConverter.convert.and.returnValue(doc);
        indexFacade.put.and.returnValue(doc);
        documentCache.get.and.returnValue(1); // just to trigger reassignment

        datastore = jasmine.createSpyObj('MockDatastore', ['changesNotifications', 'deletedNotifications', 'fetch']);
        datastore.fetch.and.returnValue(Promise.resolve(doc));

        datastore.changesNotifications.and.returnValue({subscribe: (func: Function) => fun = func});
        datastore.deletedNotifications.and.returnValue({subscribe: (func: Function) => undefined});

        rcs = new RemoteChangesStream(
            datastore,
            indexFacade,
            documentCache,
            typeConverter,
            settingsService);
    });


    it('should put to index facade and reassign to cache', async done => {

        await fun(doc);
        expect(indexFacade.put).toHaveBeenCalledWith(doc);
        expect(documentCache.reassign).toHaveBeenCalledWith(doc);
        done();
    });


    it('send through type converter', async done => {

        await fun(doc);
        expect(typeConverter.convert).toHaveBeenCalledWith(doc);
        done();
    });
});