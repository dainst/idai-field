import {
    createApp, createHelpers,
    setupSyncTestDb
} from '../subsystem-helper';

const fs = require('fs');


describe('subsystem/image-relations-manager', () => {

    let app;
    let helpers;


    beforeEach(async done => {

        await setupSyncTestDb();
        app = await createApp();
        helpers = createHelpers(app);

        spyOn(console, 'error');
        // spyOn(console, 'warn');

        fs.mkdirSync(helpers.projectImageDir, { recursive: true }); // TODO remove
        done();
    });


    it('delete TypeCatalog with images', async done => {

        const documentsLookup = await helpers.createDocuments(
          [
              ['tc1', 'TypeCatalog', ['t1']],
              ['t1', 'Type'],
              ['i1', 'Image', ['tc1']],
              ['i2', 'Image', ['t1']]
          ]
        );

        await helpers.expectResources(['tc1', 't1', 'i1', 'i2']);
        // TODO add app.existsInProjectImageDir
        expect(fs.existsSync(helpers.projectImageDir + 'i1')).toBeTruthy();
        expect(fs.existsSync(helpers.projectImageDir + 'i2')).toBeTruthy();

        await app.imageRelationsManager.remove(documentsLookup['tc1']);

        await helpers.expectResources([]);
        expect(fs.existsSync(helpers.projectImageDir + 'i1')).not.toBeTruthy();
        expect(fs.existsSync(helpers.projectImageDir + 'i2')).not.toBeTruthy();
        done();
    });


    it('delete Type with images', async done => {

        const documentsLookup = await helpers.createDocuments(
          [
              ['tc1', 'TypeCatalog', ['t1']],
              ['t1', 'Type'],
              ['i1', 'Image', ['tc1']],
              ['i2', 'Image', ['t1']]
          ]
        );

        await helpers.expectResources(['tc1', 't1', 'i1', 'i2']);
        expect(fs.existsSync(helpers.projectImageDir + 'i1')).toBeTruthy();
        expect(fs.existsSync(helpers.projectImageDir + 'i2')).toBeTruthy();

        await app.imageRelationsManager.remove(documentsLookup['t1']);

        await helpers.expectResources(['tc1', 'i1']);
        expect(fs.existsSync(helpers.projectImageDir + 'i1')).toBeTruthy();
        expect(fs.existsSync(helpers.projectImageDir + 'i2')).not.toBeTruthy();
        done();
    });


    it('delete Type and Catalog with same image', async done => {

        const documentsLookup = await helpers.createDocuments(
          [
              ['tc1', 'TypeCatalog', ['t1']],
              ['t1', 'Type'],
              ['i1', 'Image', ['tc1', 't1']]
          ]
        );

        await helpers.expectResources(['tc1', 't1', 'i1']);
        expect(fs.existsSync(helpers.projectImageDir + 'i1')).toBeTruthy();

        await app.imageRelationsManager.remove(documentsLookup['tc1']);

        await helpers.expectResources([]);
        expect(fs.existsSync(helpers.projectImageDir + 'i1')).not.toBeTruthy();
        done();
    });


    it('do not delete images (with TypeCatalog) which are also connected to other resources', async done => {

        const documentsLookup = await helpers.createDocuments(
            [
                ['tc1', 'TypeCatalog', ['t1']],
                ['t1', 'Type'],
                ['r1', 'Find'],
                ['i1', 'Image', ['tc1']],
                ['i2', 'Image', ['t1', 'r1']]
            ]
        );

        await helpers.expectResources(['tc1', 't1', 'r1', 'i1', 'i2']);
        expect(fs.existsSync(helpers.projectImageDir + 'i1')).toBeTruthy();
        expect(fs.existsSync(helpers.projectImageDir + 'i2')).toBeTruthy();

        await app.imageRelationsManager.remove(documentsLookup['tc1']);

        await helpers.expectResources(['i2', 'r1']);
        expect(fs.existsSync(helpers.projectImageDir + 'i1')).not.toBeTruthy();
        expect(fs.existsSync(helpers.projectImageDir + 'i2')).toBeTruthy();
        done();
    });


    it('delete 2 type with shared images', async done => {

        const documentsLookup = await helpers.createDocuments(
            [
                ['tc1', 'TypeCatalog', ['t1', 't2']],
                ['t1', 'Type'],
                ['t2', 'Type'],
                ['i1', 'Image', ['t1', 't2']]
            ]
        );

        await helpers.expectResources(['tc1', 't1', 't2', 'i1']);
        expect(fs.existsSync(helpers.projectImageDir + 'i1')).toBeTruthy();

        await app.imageRelationsManager.remove(documentsLookup['t1'], documentsLookup['t2']);

        await helpers.expectResources(['tc1']);
        expect(fs.existsSync(helpers.projectImageDir + 'i1')).not.toBeTruthy();
        done();
    });


    it('delete 2 type with shared images, but image is also connected to other resources', async done => {

        const documentsLookup = await helpers.createDocuments(
            [
                ['tc1', 'TypeCatalog', ['t1', 't2']],
                ['t1', 'Type'],
                ['t2', 'Type'],
                ['i1', 'Image', ['t1', 't2', 'r1']],
                ['r1', 'Find']
            ]
        );

        await helpers.expectResources(['tc1', 't1', 't2', 'i1', 'r1']);
        expect(fs.existsSync(helpers.projectImageDir + 'i1')).toBeTruthy();

        await app.imageRelationsManager.remove(documentsLookup['t1'], documentsLookup['t2']);

        await helpers.expectResources(['tc1', 'r1', 'i1']);
        expect(fs.existsSync(helpers.projectImageDir + 'i1')).toBeTruthy();
        done();
    });


    it('do not delete images (with TypeCatalog) which are also connected to ancestor resources', async done => {

        const documentsLookup = await helpers.createDocuments(
          [
              ['tc1', 'TypeCatalog', ['t1']],
              ['t1', 'Type'],
              ['i1', 'Image', ['tc1', 't1']]
          ]
        );

        expect((await app.documentDatastore.find({})).documents.length).toBe(3);
        expect(fs.existsSync(helpers.projectImageDir + 'i1')).toBeTruthy();

        await app.imageRelationsManager.remove(documentsLookup['t1']);

        await helpers.expectResources(['tc1', 'i1']);
        expect(fs.existsSync(helpers.projectImageDir + 'i1')).toBeTruthy();
        done();
    });
});
