import {PersistenceManager} from '../../../../../src/app/core/model/persistence-manager';
import {createApp, setupSyncTestDb} from '../subsystem-helper';
import {DocumentDatastore} from '../../../../../src/app/core/datastore/document-datastore';
import {Imagestore} from '../../../../../src/app/core/images/imagestore/imagestore';
import {doc} from '../../../test-helpers';
import {FieldDocument, ImageDocument} from 'idai-components-2';
import {CatalogUtil} from '../../../../../src/app/core/model/catalog-util';
import {SettingsProvider} from '../../../../../src/app/core/settings/settings-provider';

const fs = require('fs');

describe('subsystem/catalog-util', () => {

    let documentDatastore: DocumentDatastore;
    let persistenceManager: PersistenceManager;
    let imagestore: Imagestore;
    let settingsProvider: SettingsProvider;
    let projectImageDir: string;
    let username: string;


    function createImageInProjectImageDir(id: string) {

        fs.closeSync(fs.openSync(projectImageDir + id, 'w'));
        expect(fs.existsSync(projectImageDir + id)).toBeTruthy();
    }


    beforeEach(async done => {

        await setupSyncTestDb();

        const {
            documentDatastore: d,
            persistenceManager: p,
            imagestore: i,
            settingsProvider: s
        } = await createApp();

        documentDatastore = d;
        persistenceManager = p;
        imagestore = i;
        settingsProvider = s;

        username = settingsProvider.getSettings().username;

        spyOn(console, 'error');
        // spyOn(console, 'warn');

        projectImageDir = settingsProvider.getSettings().imagestorePath
            + settingsProvider.getSettings().selectedProject
            + '/';
        fs.mkdirSync(projectImageDir, { recursive: true });
        done();
    });


    it('delete catalog with images', async done => {

        const tc1 = doc('tc1', 'TypeCatalog') as FieldDocument;
        const t1 = doc('t1', 'Type') as FieldDocument;
        const i1 = doc('i1', 'Image') as ImageDocument;
        const i2 = doc('i2', 'Image') as ImageDocument;
        i1.resource.relations = { depicts: ['tc1'] };
        i2.resource.relations = { depicts: ['t1'] };
        tc1.resource.relations = { isDepictedIn: ['i1'], isRecordedIn: [] };
        t1.resource.relations = { isDepictedIn: ['i2'], isRecordedIn: [], liesWithin: ['tc1'] };

        createImageInProjectImageDir('i1');
        createImageInProjectImageDir('i2');
        await documentDatastore.create(tc1, username);
        await documentDatastore.create(t1, username);
        await documentDatastore.create(i1, username)
        await documentDatastore.create(i2, username)

        expect((await documentDatastore.find({})).documents.length).toBe(4);
        expect(fs.existsSync(projectImageDir + 'i1')).toBeTruthy();
        expect(fs.existsSync(projectImageDir + 'i2')).toBeTruthy();

        await CatalogUtil.deleteCatalogWithImages(
            persistenceManager, documentDatastore, imagestore, username, tc1.resource.id);

        expect((await documentDatastore.find({})).documents.length).toBe(0);
        expect(fs.existsSync(projectImageDir + 'i1')).not.toBeTruthy();
        expect(fs.existsSync(projectImageDir + 'i2')).not.toBeTruthy();
        done();
    });


    it('do not delete images which are also connected to other resources', async done => {

        // TODO
        done();
    });
});
