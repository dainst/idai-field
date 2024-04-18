import { BackupLoadingComponent } from '../../../../src/app/components/backup/backup-loading.component';
import { Backup } from '../../../../src/app/components/backup/backup';
import { M } from '../../../../src/app/components/messages/m';

import PouchDB = require('pouchdb-node');


/**
 * @author Daniel de Oliviera
 */
describe('BackupLoadingComponent', () => {

    const unittestdb = 'unittestdb';

    let c: BackupLoadingComponent;
    let messages: any;
    let settingsProvider: any;
    let settingsService: any;
    let backupProvider: any;
    let tabManager: any;
    let menuService: any;


    afterEach(done => new PouchDB(unittestdb).destroy().then(done));


    beforeEach(() => {

        spyOn(console, 'warn');

        const modalService = jasmine.createSpyObj('modalService', ['open']);
        messages = jasmine.createSpyObj('messages', ['add']);
        settingsProvider = jasmine.createSpyObj('settingsProvider', ['getSettings']);
        settingsService = jasmine.createSpyObj('settingsService', ['addProject']);
        backupProvider = jasmine.createSpyObj('backupProvider', ['dump', 'readDump']);
        tabManager = jasmine.createSpyObj('tabManager', ['openActiveTab']);
        menuService = jasmine.createSpyObj('menuService', ['setContext']);

        c = new BackupLoadingComponent(
            modalService,
            messages,
            settingsProvider,
            settingsService,
            backupProvider,
            tabManager,
            menuService,
            undefined
        );

        settingsProvider.getSettings.and.returnValue({ dbs: ['selectedproject'] } as any);
    });


    it('load backup: project not specified', async done => {

        c.projectIdentifier = '';
        c.path = './test/store/backup_test_file.txt';
        await c.loadBackup();

        expect(messages.add).toHaveBeenCalledWith([M.BACKUP_READ_ERROR_NO_PROJECT_IDENTIFIER]);
        done();
    });


    it('load backup: filenotexists', async done => {

        c.projectIdentifier = unittestdb;
        c.path = './test/store/backup_test_file.txt';

        backupProvider.readDump.and.returnValue(Promise.reject(Backup.FILE_NOT_EXIST));
        await c.loadBackup();

        expect(messages.add).toHaveBeenCalledWith([M.BACKUP_READ_ERROR_FILE_NOT_FOUND]);
        done();
    });


    it('load backup: cannotreaddb', async done => {

        spyOn(console, 'error');

        c.projectIdentifier = unittestdb;
        c.path = './package.json';

        backupProvider.readDump.and.returnValue(Promise.reject('reason'));
        await c.loadBackup();

        expect(messages.add).toHaveBeenCalledWith([M.BACKUP_READ_ERROR_GENERIC]);
        done();
    });


    it('readDump: show success message', async done => {

        c.projectIdentifier = unittestdb;
        c.path = './package.json';
        await c.loadBackup();

        expect(messages.add).toHaveBeenCalledWith([M.BACKUP_READ_SUCCESS]);
        done();
    });


    it('readDump: create new project via settings', async done => {

        c.projectIdentifier = unittestdb;
        c.path = './package.json';
        await c.loadBackup();

        expect(settingsService.addProject).toHaveBeenCalledWith(unittestdb);
        done();
    });
});
