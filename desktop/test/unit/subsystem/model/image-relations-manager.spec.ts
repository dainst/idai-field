import { Relation } from 'idai-field-core';
import { cleanUp, createApp, createHelpers } from '../subsystem-helper';


describe('subsystem/image-relations-manager', () => {

    let app;
    let helpers;


    beforeEach(async () => {

        app = await createApp();
        helpers = createHelpers(app);
        helpers.createProjectDir();
    });


    afterEach(async () => {

        await cleanUp();
    });


    test('remove TypeCatalog with images', async () => {

        const documentsLookup = await helpers.createDocuments(
            [
                ['tc1', 'TypeCatalog', ['t1']],
                ['t1', 'Type'],
                ['i1', 'Image', ['tc1']],
                ['i2', 'Image', ['t1']]
            ]
        );

        await helpers.expectDocuments('project', 'tc1', 't1', 'i1', 'i2');
        helpers.expectImagesExist('i1', 'i2');

        await app.imageRelationsManager.remove([documentsLookup.tc1]);

        await helpers.expectDocuments('project');
        helpers.expectImagesDontExist('i1', 'i2');
    });


    test('remove Type with images', async () => {

        const documentsLookup = await helpers.createDocuments(
            [
                ['tc1', 'TypeCatalog', ['t1']],
                ['t1', 'Type'],
                ['i1', 'Image', ['tc1']],
                ['i2', 'Image', ['t1']]
            ]
        );

        await helpers.expectDocuments('project', 'tc1', 't1', 'i1', 'i2');
        helpers.expectImagesExist('i1', 'i2');

        await app.imageRelationsManager.remove([documentsLookup.t1]);

        await helpers.expectDocuments('project', 'tc1', 'i1');
        helpers.expectImagesExist('i1');
        helpers.expectImagesDontExist('i2');
    });


    test('remove Type and Catalog with same image', async () => {

        const documentsLookup = await helpers.createDocuments(
            [
                ['tc1', 'TypeCatalog', ['t1']],
                ['t1', 'Type'],
                ['i1', 'Image', ['tc1', 't1']]
            ]
        );

        await helpers.expectDocuments('project', 'tc1', 't1', 'i1');
        helpers.expectImagesExist('i1');

        await app.imageRelationsManager.remove([documentsLookup.tc1]);

        await helpers.expectDocuments('project');
        helpers.expectImagesDontExist('i1');
    });


    test('do not remove images (with TypeCatalog) which are also connected to other resources', async () => {

        const documentsLookup = await helpers.createDocuments(
            [
                ['tc1', 'TypeCatalog', ['t1']],
                ['t1', 'Type'],
                ['tr1', 'Trench'],
                ['r1', 'Find'],
                ['i1', 'Image', ['tc1']],
                ['i2', 'Image', ['t1', 'r1']]
            ]
        );

        await helpers.updateDocument('r1', document => {
            document.resource.relations[Relation.Hierarchy.RECORDEDIN] = ['tr1'];
        });

        await helpers.expectDocuments('project', 'tc1', 't1', 'tr1', 'r1', 'i1', 'i2');
        helpers.expectImagesExist('i1', 'i2');

        await app.imageRelationsManager.remove([documentsLookup.tc1]);

        await helpers.expectDocuments('project', 'i2', 'tr1', 'r1');
        helpers.expectImagesDontExist('i1');
        helpers.expectImagesExist('i2');
    });


    test('remove 2 type with shared images', async () => {

        const documentsLookup = await helpers.createDocuments(
            [
                ['tc1', 'TypeCatalog', ['t1', 't2']],
                ['t1', 'Type'],
                ['t2', 'Type'],
                ['i1', 'Image', ['t1', 't2']]
            ]
        );

        await helpers.expectDocuments('project', 'tc1', 't1', 't2', 'i1');
        helpers.expectImagesExist('i1');

        await app.imageRelationsManager.remove([documentsLookup.t1, documentsLookup.t2]);

        await helpers.expectDocuments('project', 'tc1');
        helpers.expectImagesDontExist('i1');
    });


    test('remove 2 type with shared images, but image is also connected to other resources', async () => {

        const documentsLookup = await helpers.createDocuments(
            [
                ['tc1', 'TypeCatalog', ['t1', 't2']],
                ['t1', 'Type'],
                ['t2', 'Type'],
                ['i1', 'Image', ['t1', 't2', 'r1']],
                ['tr1', 'Trench'],
                ['r1', 'Find']
            ]
        );

        await helpers.updateDocument('r1', document => {
            document.resource.relations[Relation.Hierarchy.RECORDEDIN] = ['tr1'];
        });

        await helpers.expectDocuments('project', 'tc1', 't1', 't2', 'i1', 'tr1', 'r1');
        helpers.expectImagesExist('i1');

        await app.imageRelationsManager.remove([documentsLookup.t1, documentsLookup.t2]);

        await helpers.expectDocuments('project', 'tc1', 'tr1', 'r1', 'i1');
        helpers.expectImagesExist('i1');
    });


    test('do not remove images (with TypeCatalog) which are also connected to ancestor resources', async () => {

        const documentsLookup = await helpers.createDocuments(
            [
                ['tc1', 'TypeCatalog', ['t1']],
                ['t1', 'Type'],
                ['i1', 'Image', ['tc1', 't1']]
            ]
        );

        await helpers.expectDocuments('project', 'tc1', 't1', 'i1');
        helpers.expectImagesExist('i1');

        await app.imageRelationsManager.remove([documentsLookup.t1]);

        await helpers.expectDocuments('project', 'tc1', 'i1');
        helpers.expectImagesExist('i1');
    });


    test('remove images', async () => {

        const documentsLookup = await helpers.createDocuments(
            [
                ['tc1', 'TypeCatalog'],
                ['i1', 'Image', ['tc1']]
            ]
        );
        expect(documentsLookup.tc1.resource.relations[Relation.Image.ISDEPICTEDIN]).toEqual(['i1']);
        await app.imageRelationsManager.remove([documentsLookup.i1]);

        await helpers.expectDocuments('project', 'tc1');
        const tc1 = await app.datastore.get('tc1');
        expect(tc1.resource.relations[Relation.Image.ISDEPICTEDIN]).toBeUndefined();
    });


    test('remove images - where image is connected to another resource, but is nevertheless deleted because image is amongst resources to be deleted', async () => {

        const documentsLookup = await helpers.createDocuments(
            [
                ['t1', 'Type'],
                ['i1', 'Image', ['t1', 'r1']],
                ['tr1', 'Trench'],
                ['r1', 'Find']
            ]
        );

        await helpers.updateDocument('r1', document => {
            document.resource.relations[Relation.Hierarchy.RECORDEDIN] = ['tr1'];
        });

        helpers.expectImagesExist('i1');

        await app.imageRelationsManager.remove([documentsLookup.t1, documentsLookup.i1]);

        await helpers.expectDocuments('project', 'tr1', 'r1');
        helpers.expectImagesDontExist('i1');
    });


    test('add depicts relation', async () => {

        const documentsLookup = await helpers.createDocuments(
            [
                ['tc1', 'TypeCatalog'],
                ['i1', 'Image']
            ]
        );

        expect(documentsLookup.tc1.resource.relations[Relation.Image.ISDEPICTEDIN]).toBeUndefined();
        expect(documentsLookup.i1.resource.relations[Relation.Image.DEPICTS]).toBeUndefined();

        await app.imageRelationsManager.link(documentsLookup.tc1, documentsLookup.i1);

        const tc1 = await app.datastore.get('tc1');
        const i1 = await app.datastore.get('i1');

        expect(i1.resource.relations[Relation.Image.DEPICTS]).toEqual(['tc1']);
        expect(tc1.resource.relations[Relation.Image.ISDEPICTEDIN]).toEqual(['i1']);
    });


    test('add depicts relation - throw if trying to link image with resource if either is not owned', async () => {

        const documentsLookup = await helpers.createDocuments(
            [
                ['tc1', 'TypeCatalog'],
                ['i1', 'Image']
            ]
        );

        documentsLookup.tc1.project = 'other-project';
        try {
            await app.imageRelationsManager.link(documentsLookup.tc1, documentsLookup.i1);
            throw new Error('Test failure');
        } catch {}

        documentsLookup.i1.project = 'other-project';
        try {
            await app.imageRelationsManager.link(documentsLookup.tc1, documentsLookup.i1);
            throw new Error('Test failure');
        } catch {}
    });


    test('remove depicts relation', async () => {

        const documentsLookup = await helpers.createDocuments(
            [
                ['tc1', 'TypeCatalog'],
                ['i1', 'Image', ['tc1']]
            ]
        );

        expect(documentsLookup.tc1.resource.relations[Relation.Image.ISDEPICTEDIN]).toEqual(['i1']);
        expect(documentsLookup.i1.resource.relations[Relation.Image.DEPICTS]).toEqual(['tc1']);

        await app.imageRelationsManager.unlink(documentsLookup.i1);

        const tc1 = await app.datastore.get('tc1');
        const i1 = await app.datastore.get('i1');
        expect(tc1.resource.relations[Relation.Image.ISDEPICTEDIN]).toBeUndefined();
        expect(i1.resource.relations[Relation.Image.DEPICTS]).toBeUndefined();
    });


    test('remove depicts relation between image documennt document', async () => {

        const documentsLookup = await helpers.createDocuments(
            [
                ['tc1', 'TypeCatalog'],
                ['tc2', 'TypeCatalog'],
                ['i1', 'Image', ['tc1', 'tc2']]
            ]
        );

        expect(documentsLookup.tc1.resource.relations[Relation.Image.ISDEPICTEDIN]).toEqual(['i1']);
        expect(documentsLookup.tc2.resource.relations[Relation.Image.ISDEPICTEDIN]).toEqual(['i1']);
        expect(documentsLookup.i1.resource.relations[Relation.Image.DEPICTS]).toEqual(['tc1', 'tc2']);

        await app.imageRelationsManager.unlink(documentsLookup.tc1, documentsLookup.i1);

        const tc1 = await app.datastore.get('tc1');
        const tc2 = await app.datastore.get('tc2');
        const i1 = await app.datastore.get('i1');

        expect(tc1.resource.relations[Relation.Image.ISDEPICTEDIN]).toBeUndefined();
        expect(tc2.resource.relations[Relation.Image.ISDEPICTEDIN]).toEqual(['i1']);
        expect(i1.resource.relations[Relation.Image.DEPICTS]).toEqual(['tc2']);
    });


    test('only first might be non image document', async () => {

        const documentsLookup = await helpers.createDocuments(
            [
                ['tc1', 'TypeCatalog'],
                ['tc2', 'TypeCatalog']
            ]
        );

        try {
            await app.imageRelationsManager.unlink(documentsLookup.tc1, documentsLookup.tc2);
            throw new Error('Test failure');
        } catch (err) {
            expect(err.includes('illegal argument')).toBeTruthy();
        }
    });
});
