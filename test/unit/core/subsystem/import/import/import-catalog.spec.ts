import {createApp, createHelpers, setupSyncTestDb} from '../../subsystem-helper';
import {
    buildImportCatalogFunction,
    ImportCatalogErrors
} from '../../../../../../src/app/core/import/import/import-catalog';
import {ImageRelations, TypeRelations} from '../../../../../../src/app/core/model/relation-constants';
import {createDocuments, NiceDocs} from '../../../../test-helpers';


describe('subsystem/import/importCatalog', () => {

    let importCatalog;
    let app;
    let helpers;


    beforeEach(async done => {

        await setupSyncTestDb();
        app = await createApp();
        helpers = createHelpers(app);
        helpers.createProjectDir();

        spyOn(console, 'error');
        // spyOn(console, 'warn');

        importCatalog = buildImportCatalogFunction(
            {
                datastore: app.documentDatastore,
                relationsManager: app.relationsManager,
                imageRelationsManager: app.imageRelationsManager,
                imagestore: app.imagestore
            },
            {
                username: app.settingsProvider.getSettings().username,
                selectedProject: app.settingsProvider.getSettings().selectedProject
            });
        done();
    });


    it('import a TypeCatalog resource', async done => {

        const documentsLookup = await createDocuments([['tc1', 'TypeCatalog']]);
        await importCatalog([documentsLookup['tc1']]);

        await helpers.expectResources('tc1');
        done();
    });


    it('reimport', async done => {

        const documents: NiceDocs = [
            ['tc1', 'TypeCatalog', ['t1']],
            ['t1', 'Type']
        ];

        await helpers.createDocuments(documents);
        await helpers.updateDocument('t1', document => {
            document.resource.relations[TypeRelations.HASINSTANCE] = ['F1'];
        });

        const documentsLookup = createDocuments(documents);
        await importCatalog([documentsLookup['tc1']]);

        const newDocument = await app.documentDatastore.get('t1');
        expect(newDocument.resource.relations['hasInstance']).toEqual(['F1'])
        done();
    });


    it('reimport - image removed', async done => {

        await helpers.createDocuments([
            ['tc1', 'TypeCatalog', ['t1']],
            ['t1', 'Type'],
            ['i1', 'Image', ['t1']]
        ]);
        helpers.expectImagesExist('i1');

        const documentsLookup = createDocuments([
            ['tc1', 'TypeCatalog', ['t1']],
            ['t1', 'Type']
        ]);
        await importCatalog([documentsLookup['tc1'], documentsLookup['t1']]);

        helpers.expectImagesDontExist('i1');
        const newDocument = await app.documentDatastore.get('t1');
        expect(newDocument.resource.relations[ImageRelations.ISDEPICTEDIN]).toBeUndefined();
        done();
    });


    it('reimport deletion - type resource was connected to other resource previously', async done => {

        const documents: NiceDocs = [
            ['tc1', 'TypeCatalog', ['t1']],
            ['t1', 'Type']
        ];

        await helpers.createDocuments(documents);
        await helpers.updateDocument('t1', document => {
            document.resource.relations[TypeRelations.HASINSTANCE] = ['F1'];
        });

        const documentsLookup = createDocuments(documents);
        const result = await importCatalog([documentsLookup['tc1']]);
        expect(result.successfulImports).toBe(0);
        expect(result.errors[0][0]).toEqual(ImportCatalogErrors.CONNECTED_TYPE_DELETED);
        expect(result.errors[0][1]).toEqual('identifiert1');
        done();
    });


    it('reimport deletion - type resource was unconnected', async done => {

        await helpers.createDocuments([
            ['tc1', 'TypeCatalog', ['t1']],
            ['t1', 'Type']
        ]);
        const catalog = Object.values(createDocuments([
            ['tc1', 'TypeCatalog'],
        ]));
        const result = await importCatalog(catalog);
        expect(result.successfulImports).toBe(1);
        expect(result.errors).toEqual([]);

        await helpers.expectResources('tc1');
        done();
    });


    it('document.project differs between resources', async done => {

        const catalog = createDocuments([
            ['tc1', 'TypeCatalog', ['t1']],
            ['t1', 'Type']
        ]);
        catalog['tc1'].project = 'a';
        catalog['t1'].project = 'b';
        const result = await importCatalog(Object.values(catalog));
        expect(result.successfulImports).toBe(0);
        expect(result.errors[0][0]).toBe(ImportCatalogErrors.DIFFERENT_PROJECT_ENTRIES);
        done();
    });


    it('no type catalog resource', async done => {

        const catalog = createDocuments([
            ['t1', 'Type']
        ]);
        const result = await importCatalog(Object.values(catalog));
        expect(result.successfulImports).toBe(0);
        expect(result.errors[0][0]).toBe(ImportCatalogErrors.NO_OR_TOO_MANY_TYPE_CATALOG_DOCUMENTS);
        done();
    });
});
