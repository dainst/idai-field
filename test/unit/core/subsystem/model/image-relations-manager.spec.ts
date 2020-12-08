import {
    createApp,
    setupSyncTestDb
} from '../subsystem-helper';

const fs = require('fs');


describe('subsystem/image-relations-manager', () => {

    let app;


    beforeEach(async done => {

        await setupSyncTestDb();
        app = await createApp();

        spyOn(console, 'error');
        // spyOn(console, 'warn');

        fs.mkdirSync(app.projectImageDir, { recursive: true }); // TODO remove
        done();
    });


    it('delete TypeCatalog with images', async done => {

        const documentsLookup = await app.createDocuments(
          [
              ['tc1', 'TypeCatalog', ['t1']],
              ['t1', 'Type'],
              ['i1', 'Image', ['tc1']],
              ['i2', 'Image', ['t1']]
          ]
        );

        await app.expectResources(['tc1', 't1', 'i1', 'i2']);
        // TODO add app.existsInProjectImageDir
        expect(fs.existsSync(app.projectImageDir + 'i1')).toBeTruthy();
        expect(fs.existsSync(app.projectImageDir + 'i2')).toBeTruthy();

        await app.imageRelationsManager.remove(documentsLookup['tc1']);

        await app.expectResources([]);
        expect(fs.existsSync(app.projectImageDir + 'i1')).not.toBeTruthy();
        expect(fs.existsSync(app.projectImageDir + 'i2')).not.toBeTruthy();
        done();
    });


    it('delete Type with images', async done => {

        const documentsLookup = await app.createDocuments(
          [
              ['tc1', 'TypeCatalog', ['t1']],
              ['t1', 'Type'],
              ['i1', 'Image', ['tc1']],
              ['i2', 'Image', ['t1']]
          ]
        );

        await app.expectResources(['tc1', 't1', 'i1', 'i2']);
        expect(fs.existsSync(app.projectImageDir + 'i1')).toBeTruthy();
        expect(fs.existsSync(app.projectImageDir + 'i2')).toBeTruthy();

        await app.imageRelationsManager.remove(documentsLookup['t1']);

        await app.expectResources(['tc1', 'i1']);
        expect(fs.existsSync(app.projectImageDir + 'i1')).toBeTruthy();
        expect(fs.existsSync(app.projectImageDir + 'i2')).not.toBeTruthy();
        done();
    });


    it('delete Type and Catalog with same image', async done => {

        const documentsLookup = await app.createDocuments(
          [
              ['tc1', 'TypeCatalog', ['t1']],
              ['t1', 'Type'],
              ['i1', 'Image', ['tc1', 't1']]
          ]
        );

        await app.expectResources(['tc1', 't1', 'i1']);
        expect(fs.existsSync(app.projectImageDir + 'i1')).toBeTruthy();

        await app.imageRelationsManager.remove(documentsLookup['tc1']);

        await app.expectResources([]);
        expect(fs.existsSync(app.projectImageDir + 'i1')).not.toBeTruthy();
        done();
    });


    it('do not delete images (with TypeCatalog) which are also connected to other resources', async done => {

        const documentsLookup = await app.createDocuments(
            [
                ['tc1', 'TypeCatalog', ['t1']],
                ['t1', 'Type'],
                ['r1', 'Find'],
                ['i1', 'Image', ['tc1']],
                ['i2', 'Image', ['t1', 'r1']]
            ]
        );

        await app.expectResources(['tc1', 't1', 'r1', 'i1', 'i2']);
        expect(fs.existsSync(app.projectImageDir + 'i1')).toBeTruthy();
        expect(fs.existsSync(app.projectImageDir + 'i2')).toBeTruthy();

        await app.imageRelationsManager.remove(documentsLookup['tc1']);

        await app.expectResources(['i2', 'r1']);
        expect(fs.existsSync(app.projectImageDir + 'i1')).not.toBeTruthy();
        expect(fs.existsSync(app.projectImageDir + 'i2')).toBeTruthy();
        done();
    });


    it('do not delete images (with TypeCatalog) which are also connected to ancestor resources', async done => {

        const documentsLookup = await app.createDocuments(
          [
              ['tc1', 'TypeCatalog', ['t1']],
              ['t1', 'Type'],
              ['i1', 'Image', ['tc1', 't1']]
          ]
        );

        expect((await app.documentDatastore.find({})).documents.length).toBe(3);
        expect(fs.existsSync(app.projectImageDir + 'i1')).toBeTruthy();

        await app.imageRelationsManager.remove(documentsLookup['t1']);

        await app.expectResources(['tc1', 'i1']);
        expect(fs.existsSync(app.projectImageDir + 'i1')).toBeTruthy();
        done();
    });
});
