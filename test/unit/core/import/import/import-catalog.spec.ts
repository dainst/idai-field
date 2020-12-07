import {
    buildImportCatalogFunction,
    ImportCatalogErrors
} from '../../../../../src/app/core/import/import/import-catalog';
import {createLookup} from '../../../test-helpers';
import {clone} from 'tsfun/struct';
import {TypeRelations} from '../../../../../src/app/core/model/relation-constants';


describe('importCatalog', () => {

    let datastore;
    let relationsManager;
    let imageRelationsManager;
    let importCatalog;

    beforeEach(() => {

        datastore = jasmine.createSpyObj('datastore', ['create', 'update']);
        relationsManager = jasmine.createSpyObj('relationsManager', ['get'])
        imageRelationsManager = jasmine.createSpyObj('imageRelationsManager', ['remove']);
        const username = 'testuser';
        const selectedProject = 'test';
        importCatalog = buildImportCatalogFunction(
            {datastore, relationsManager, imageRelationsManager}, {username, selectedProject});
    });


    it('base case', async done => {

        let called = false;
        relationsManager.get.and.returnValue([]);
        datastore.create.and.callFake(document => {
            expect(document.resource.id).toBe('tc1');
            called = true;
        });

        const documentsLookup = createLookup([['tc1', 'TypeCatalog']]);
        await importCatalog([documentsLookup['tc1']]);

        expect(called).toBeTruthy();
        done();
    });


    it('do not overwrite existing relations to find', async done => {

        const documentsLookup = createLookup([['tc1', 'TypeCatalog']]);
        const oldDocument = clone(documentsLookup['tc1']);
        oldDocument.resource.relations[TypeRelations.HASINSTANCE] = ['F1'];

        let called = false;
        relationsManager.get.and.returnValue([oldDocument]);
        datastore.update.and.callFake(document => {
            expect(document.resource.id).toBe('tc1');
            expect(document.resource.relations['hasInstance']).toEqual(['F1']);
            called = true;
        });

        await importCatalog([documentsLookup['tc1']]);

        expect(called).toBeTruthy();
        done();
    });


    it('type resource deleted on reimport - type resource was connected to other resource previously', async done => {

        const documentsLookup = createLookup(
            [
                ['tc1', 'TypeCatalog', ['t1']],
                ['t1', 'Type']
            ]
        );
        const oldCatalog = clone(documentsLookup['tc1']);
        const oldType = clone(documentsLookup['t1']);
        oldType.resource.relations[TypeRelations.HASINSTANCE] = ['F1'];
        relationsManager.get.and.returnValue([oldCatalog, oldType]);

        const result = await importCatalog([documentsLookup['tc1']]);
        expect(result.successfulImports).toBe(0);
        expect(result.errors[0][0]).toEqual(ImportCatalogErrors.CONNECTED_TYPE_DELETED);
        done();
    });


    it('type resource deleted on reimport - type resource was unconnected', async done => {

        const documentsLookup = createLookup(
            [
                ['tc1', 'TypeCatalog', ['t1']],
                ['t1', 'Type']
            ]
        );
        const oldCatalog = clone(documentsLookup['tc1']);
        const oldType = clone(documentsLookup['t1']);
        relationsManager.get.and.returnValue([oldCatalog, oldType]);

        const result = await importCatalog([documentsLookup['tc1']]);
        expect(result.successfulImports).toBe(1);
        expect(result.errors).toEqual([]);

        // TODO other expectations?
        done();
    });
});
