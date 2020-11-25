import {CatalogUtil} from '../../../../src/app/core/model/catalog-util';

describe('CatalogUtil', () => { // TODO convert to subsystem test

    let persistenceManager;
    let datastore;
    let imagestore;

    it('test', async done => {

        persistenceManager = jasmine.createSpyObj('persistenceManager', ['remove']);
        datastore = jasmine.createSpyObj('datastore', ['find', 'get', 'remove']);
        imagestore = jasmine.createSpyObj('imageManager', ['remove', 'getPath']);

        datastore.find.and.returnValue({ documents: [] });
        imagestore.getPath.and.returnValue('somePath');

        const document = {
            resource: {
                category: 'TypeCatalog',
                id: 'id1',
                relations: {}
            }
        } as any

        datastore.get.and.returnValue(document);

        await CatalogUtil.deleteCatalogWithImages(
            persistenceManager, datastore, imagestore, 'testuser', document);

        expect(persistenceManager.remove).toHaveBeenCalled();
        done();
    });
});
