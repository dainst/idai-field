import {
    createApp,
    setupSyncTestDb
} from '../../subsystem-helper';
import {
    buildImportCatalogFunction,
    ImportCatalogErrors
} from '../../../../../../src/app/core/import/import/import-catalog';
import {TypeRelations} from '../../../../../../src/app/core/model/relation-constants';
import {createLookup} from '../../../../test-helpers';

const fs = require('fs');


describe('subsystem/import/importCatalog', () => {

    let importCatalog;
    let app;


    beforeEach(async done => {

        await setupSyncTestDb();
        app = await createApp();

        spyOn(console, 'error');
        // spyOn(console, 'warn');

        fs.mkdirSync(app.projectImageDir, { recursive: true }); // TODO do in createApp() ?

        importCatalog = buildImportCatalogFunction(
            {
                datastore: app.documentDatastore,
                relationsManager: app.relationsManager,
                imageRelationsManager: app.imageRelationsManager
            },
            {
                username: app.settingsProvider.getSettings().username,
                selectedProject: app.settingsProvider.getSettings().selectedProject
            });
        done();
    });


    it('import a TypeCatalog resource', async done => {

        const documentsLookup = await createLookup([['tc1', 'TypeCatalog']]);
        await importCatalog([documentsLookup['tc1']]);

        await app.expectResources(['tc1']);
        done();
    });


    it('do not overwrite existing relations to find', async done => {

        await app.createDocuments([['tc1', 'TypeCatalog']]);

        // TODO make update function
        const oldDocument = await app.documentDatastore.get('tc1');
        oldDocument.resource.relations[TypeRelations.HASINSTANCE] = ['F1'];
        await app.documentDatastore.update(
            oldDocument, app.settingsProvider.getSettings().username);

        const documentsLookup = createLookup([['tc1', 'TypeCatalog']]);
        await importCatalog([documentsLookup['tc1']]);

        const newDocument = await app.documentDatastore.get('tc1');
        expect(newDocument.resource.relations['hasInstance']).toEqual(['F1'])
        done();
    });


    it('type resource deleted on reimport - type resource was connected to other resource previously', async done => {

        const documents: any = [
            ['tc1', 'TypeCatalog', ['t1']],
            ['t1', 'Type']
        ];

        await app.createDocuments(documents);
        const oldType = await app.documentDatastore.get('t1');
        oldType.resource.relations[TypeRelations.HASINSTANCE] = ['F1'];
        await app.documentDatastore.update(
            oldType, app.settingsProvider.getSettings().username);

        const documentsLookup = createLookup(documents);
        const result = await importCatalog([documentsLookup['tc1']]);
        expect(result.successfulImports).toBe(0);
        expect(result.errors[0][0]).toEqual(ImportCatalogErrors.CONNECTED_TYPE_DELETED);
        done();
    });


    it('type resource deleted on reimport - type resource was unconnected', async done => {

        const documents: any = [
            ['tc1', 'TypeCatalog', ['t1']],
            ['t1', 'Type']
        ];

        await app.createDocuments(documents);

        const documentsLookup = createLookup(documents);
        const result = await importCatalog([documentsLookup['tc1']]);
        expect(result.successfulImports).toBe(1);
        expect(result.errors).toEqual([]);

        // TODO other expectations?
        done();
    });
});
