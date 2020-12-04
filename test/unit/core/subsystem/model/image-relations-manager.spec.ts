import {RelationsManager} from '../../../../../src/app/core/model/relations-manager';
import {createApp, setupSyncTestDb} from '../subsystem-helper';
import {DocumentDatastore} from '../../../../../src/app/core/datastore/document-datastore';
import {Imagestore} from '../../../../../src/app/core/images/imagestore/imagestore';
import {createLookup, doc} from '../../../test-helpers';
import {FieldDocument, toResourceId} from 'idai-components-2';
import {ImageRelationsManager} from '../../../../../src/app/core/model/image-relations-manager';
import {SettingsProvider} from '../../../../../src/app/core/settings/settings-provider';
import {sameset} from 'tsfun';
import {HierarchicalRelations, ImageRelations} from '../../../../../src/app/core/model/relation-constants';
import {Lookup} from '../../../../../src/app/core/util/utils';

const fs = require('fs');


describe('subsystem/image-relations-manager', () => {

    let documentDatastore: DocumentDatastore;
    let persistenceManager: RelationsManager;
    let imagestore: Imagestore;
    let settingsProvider: SettingsProvider;
    let projectImageDir: string;
    let username: string;
    let imageRelationsManager: ImageRelationsManager;


    function createImageInProjectImageDir(id: string) {

        fs.closeSync(fs.openSync(projectImageDir + id, 'w'));
        expect(fs.existsSync(projectImageDir + id)).toBeTruthy();
    }


    async function create(documents: Array<[string, string, Array<string>]|[string, string]>) {

        const documentsLookup = createLookup(documents);
        for (const document of Object.values(documentsLookup)) {
            await documentDatastore.create(document, username);
        }
        for (const [id, type, _] of documents) {
            if (type === 'Image') createImageInProjectImageDir(id);
        }
        return documentsLookup;
    }


    async function expectResources(resourceIds: string[]) {

        const documents = (await documentDatastore.find({})).documents;
        expect(sameset(documents.map(toResourceId), resourceIds)).toBeTruthy();
    }


    beforeEach(async done => {

        await setupSyncTestDb();

        const {
            documentDatastore: d,
            relationsManager: p,
            imagestore: i,
            imageRelationsManager: irm,
            settingsProvider: s
        } = await createApp();

        documentDatastore = d;
        persistenceManager = p;
        imagestore = i;
        settingsProvider = s;
        imageRelationsManager = irm;

        username = settingsProvider.getSettings().username;

        spyOn(console, 'error');
        // spyOn(console, 'warn');

        projectImageDir = settingsProvider.getSettings().imagestorePath
            + settingsProvider.getSettings().selectedProject
            + '/';
        fs.mkdirSync(projectImageDir, { recursive: true });
        done();
    });


    it('delete TypeCatalog with images', async done => {

        const documentsLookup = await create(
          [
              ['tc1', 'TypeCatalog', ['t1']],
              ['t1', 'Type'],
              ['i1', 'Image', ['tc1']],
              ['i2', 'Image', ['t1']]
          ]
        );

        await expectResources(['tc1', 't1', 'i1', 'i2']);
        expect(fs.existsSync(projectImageDir + 'i1')).toBeTruthy();
        expect(fs.existsSync(projectImageDir + 'i2')).toBeTruthy();

        await imageRelationsManager.remove(documentsLookup['tc1']);

        await expectResources([]);
        expect(fs.existsSync(projectImageDir + 'i1')).not.toBeTruthy();
        expect(fs.existsSync(projectImageDir + 'i2')).not.toBeTruthy();
        done();
    });


    it('delete Type with images', async done => {

        const documentsLookup = await create(
          [
              ['tc1', 'TypeCatalog', ['t1']],
              ['t1', 'Type'],
              ['i1', 'Image', ['tc1']],
              ['i2', 'Image', ['t1']]
          ]
        );

        await expectResources(['tc1', 't1', 'i1', 'i2']);
        expect(fs.existsSync(projectImageDir + 'i1')).toBeTruthy();
        expect(fs.existsSync(projectImageDir + 'i2')).toBeTruthy();

        await imageRelationsManager.remove(documentsLookup['t1']);

        await expectResources(['tc1', 'i1']);
        expect(fs.existsSync(projectImageDir + 'i1')).toBeTruthy();
        expect(fs.existsSync(projectImageDir + 'i2')).not.toBeTruthy();
        done();
    });


    it('delete Type and Catalog with same image', async done => {

        const documentsLookup = await create(
          [
              ['tc1', 'TypeCatalog', ['t1']],
              ['t1', 'Type'],
              ['i1', 'Image', ['tc1', 't1']]
          ]
        );

        await expectResources(['tc1', 't1', 'i1']);
        expect(fs.existsSync(projectImageDir + 'i1')).toBeTruthy();

        await imageRelationsManager.remove(documentsLookup['tc1']);

        await expectResources([]);
        expect(fs.existsSync(projectImageDir + 'i1')).not.toBeTruthy();
        done();
    });


    it('do not delete images (with TypeCatalog) which are also connected to other resources', async done => {

        const documentsLookup = await create(
            [
                ['tc1', 'TypeCatalog', ['t1']],
                ['t1', 'Type'],
                ['r1', 'Find'],
                ['i1', 'Image', ['tc1']],
                ['i2', 'Image', ['t1', 'r1']]
            ]
        );

        await expectResources(['tc1', 't1', 'r1', 'i1', 'i2']);
        expect(fs.existsSync(projectImageDir + 'i1')).toBeTruthy();
        expect(fs.existsSync(projectImageDir + 'i2')).toBeTruthy();

        await imageRelationsManager.remove(documentsLookup['tc1']);

        await expectResources(['i2', 'r1']);
        expect(fs.existsSync(projectImageDir + 'i1')).not.toBeTruthy();
        expect(fs.existsSync(projectImageDir + 'i2')).toBeTruthy();
        done();
    });


    it('do not delete images (with TypeCatalog) which are also connected to ancestor resources', async done => {

        const documentsLookup = await create(
          [
              ['tc1', 'TypeCatalog', ['t1']],
              ['t1', 'Type'],
              ['i1', 'Image', ['tc1', 't1']]
          ]
        );

        expect((await documentDatastore.find({})).documents.length).toBe(3);
        expect(fs.existsSync(projectImageDir + 'i1')).toBeTruthy();

        await imageRelationsManager.remove(documentsLookup['t1']);

        await expectResources(['tc1', 'i1']);
        expect(fs.existsSync(projectImageDir + 'i1')).toBeTruthy();
        done();
    });
});
