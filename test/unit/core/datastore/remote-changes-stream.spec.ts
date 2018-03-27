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

    beforeEach(() => {

        doc = Static.doc('sd1', 'ident1', 'type1', 'id1');

        indexFacade = jasmine.createSpyObj('MockIndexFacade', ['put', 'get', 'remove']);
        typeConverter = jasmine.createSpyObj('MockTypeConverter', ['convert']);
        documentCache = jasmine.createSpyObj('MockTypeConverter', ['get', 'reassign']);

        typeConverter.convert.and.returnValue(doc);
        indexFacade.put.and.returnValue(doc);
        documentCache.get.and.returnValue(1); // just to trigger reassignment

        datastore = jasmine.createSpyObj('MockDatastore', ['remoteChangesNotifications', 'remoteDeletedNotifications']);

        let fun;
        datastore.remoteChangesNotifications.and.returnValue({subscribe: (func: Function) => fun = func});
        datastore.remoteDeletedNotifications.and.returnValue({subscribe: (func: Function) => undefined});

        rcs = new RemoteChangesStream(
            datastore,
            indexFacade,
            documentCache,
            typeConverter);

        fun(doc);
    });


    it('should put to index facade and reassign to cache', async () => {

        expect(indexFacade.put).toHaveBeenCalledWith(doc);
        expect(documentCache.reassign).toHaveBeenCalledWith(doc);
    });


    it('send through type converter', async () => {

        expect(typeConverter.convert).toHaveBeenCalledWith(doc);
    });
});