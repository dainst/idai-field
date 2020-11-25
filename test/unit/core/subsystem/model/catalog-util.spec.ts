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

        spyOn(console, 'error');
        // spyOn(console, 'warn');

        done();
    });


    it('base', async done => {

        const dir = settingsProvider.getSettings().imagestorePath
            + settingsProvider.getSettings().selectedProject
            + '/'; // TODO OS's

        fs.mkdirSync(dir, { recursive: true });
        fs.closeSync(fs.openSync(dir + 'i1', 'w'));
        expect(fs.existsSync(dir + 'i1')).toBeTruthy();

        const t1 = doc('t1', 'TypeCatalog') as FieldDocument;
        const i1 = doc('i1', 'Image') as ImageDocument;
        i1.resource.relations = { depicts: ['t1'] };
        t1.resource.relations = { isDepictedIn: ['i1'], isRecordedIn: [] }

        await documentDatastore.create(t1, 'test');
        await documentDatastore.create(i1, 'test')
        expect((await documentDatastore.find({})).documents.length).toBe(2);

        await CatalogUtil.deleteCatalogWithImages(
            persistenceManager, documentDatastore, imagestore, 'test', t1);

        expect((await documentDatastore.find({})).documents.length).toBe(0);
        expect(fs.existsSync(dir + 'i1')).not.toBeTruthy();
        done();
    });


    it('do not delete images which are also connected to other resources', async done => {

        // TODO
        done();
    });
});
