import {
    createApp,
    setupSyncTestDb
} from '../../subsystem-helper';
import {
    buildImportCatalogFunction,
    ImportCatalogErrors
} from '../../../../../../src/app/core/import/import/import-catalog';
import {ImageRelations, TypeRelations} from '../../../../../../src/app/core/model/relation-constants';
import {createLookup, NiceDocs} from '../../../../test-helpers';

const fs = require('fs');


describe('subsystem/import/importCatalog', () => {

    let importCatalog;
    let app;


    function remakeProjectDir(app) {

        try {
            // node 12 supports fs.rmdirSync(path, {recursive: true})
            const files = fs.readdirSync(app.projectImageDir);
            for (const file of files) {
                fs.unlinkSync(app.projectImageDir + file);
            }
            if (fs.existsSync(app.projectImageDir)) fs.rmdirSync(app.projectImageDir);
        } catch (e) {
            console.log("error deleting tmp project dir", e)
        }
        fs.mkdirSync(app.projectImageDir, { recursive: true }); // TODO do in createApp() ?
    }


    beforeEach(async done => {

        await setupSyncTestDb();
        app = await createApp();

        spyOn(console, 'error');
        // spyOn(console, 'warn');

        remakeProjectDir(app)

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


    it('reimport', async done => {

        const documents: NiceDocs = [
            ['tc1', 'TypeCatalog', ['t1']],
            ['t1', 'Type']
        ];

        await app.createDocuments(documents);
        await app.updateDocument('t1', document => {
            document.resource.relations[TypeRelations.HASINSTANCE] = ['F1'];
        });

        const documentsLookup = createLookup(documents);
        await importCatalog([documentsLookup['tc1']]);

        const newDocument = await app.documentDatastore.get('t1');
        expect(newDocument.resource.relations['hasInstance']).toEqual(['F1'])
        done();
    });


    xit('reimport - image removed', async done => { // TODO enable

        const documents: NiceDocs = [
            ['tc1', 'TypeCatalog', ['t1']],
            ['t1', 'Type'],
            ['i1', 'Image', ['t1']]
        ];

        await app.createDocuments(documents);
        expect(fs.existsSync(app.projectImageDir + 'i1')).toBeTruthy();

        const documentsLookup = createLookup(documents);
        await importCatalog([documentsLookup['tc1'], documentsLookup['t1']]);

        expect(fs.existsSync(app.projectImageDir + 'i1')).not.toBeTruthy();
        const newDocument = await app.documentDatastore.get('t1');
        expect(newDocument.resource.relations[ImageRelations.ISDEPICTEDIN]).toBeUndefined();
        done();
    });


    it('reimport deletion - type resource was connected to other resource previously', async done => {

        const documents: NiceDocs = [
            ['tc1', 'TypeCatalog', ['t1']],
            ['t1', 'Type']
        ];

        await app.createDocuments(documents);
        await app.updateDocument('t1', document => {
            document.resource.relations[TypeRelations.HASINSTANCE] = ['F1'];
        });

        const documentsLookup = createLookup(documents);
        const result = await importCatalog([documentsLookup['tc1']]);
        expect(result.successfulImports).toBe(0);
        expect(result.errors[0][0]).toEqual(ImportCatalogErrors.CONNECTED_TYPE_DELETED);
        done();
    });


    it('reimport deletion - type resource was unconnected', async done => {

        const documents: NiceDocs = [
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


    it('type resource deleted on reimport - images are removed properly', async done => {
        // TODO
        done();
    });


    it('on reimport - type resource was connected to more images previously', async done => {
        // TODO
        done();
    });
});
