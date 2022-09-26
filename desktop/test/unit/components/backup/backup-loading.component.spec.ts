import PouchDB = require('pouchdb-node');
import { BackupLoadingComponent } from '../../../../src/app/components/backup/backup-loading.component';
import { Backup } from '../../../../src/app/components/backup/backup';
import { M } from '../../../../src/app/components/messages/m';


/**
 * @author Daniel de Oliviera
 */
describe('BackupLoadingComponent', () => {

    const backupFilePath = 'test/store/backup_test_file.txt';
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

        const dialogProvider = jasmine.createSpyObj('dialogProvider', ['chooseFilepath']);
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
            menuService
        );

        settingsProvider.getSettings.and.returnValue({ dbs: ['selectedproject'] } as any);
        dialogProvider.chooseFilepath.and.returnValue(Promise.resolve(backupFilePath));
    });


    it('load backup: project not specified', async done => {

        c.projectName = '';
        c.path = './test/store/backup_test_file.txt';
        await c.loadBackup();

        expect(messages.add).toHaveBeenCalledWith([M.BACKUP_READ_ERROR_NO_PROJECT_NAME]);
        done();
    });


    it('load backup: filenotexists', async done => {

        c.projectName = unittestdb;
        c.path = './test/store/backup_test_file.txt';

        backupProvider.readDump.and.returnValue(Promise.reject(Backup.FILE_NOT_EXIST));
        await c.loadBackup();

        expect(messages.add).toHaveBeenCalledWith([M.BACKUP_READ_ERROR_FILE_NOT_FOUND]);
        done();
    });


    it('load backup: cannotreaddb', async done => {

        spyOn(console, 'error');

        c.projectName = unittestdb;
        c.path = './package.json';

        backupProvider.readDump.and.returnValue(Promise.reject('reason'));
        await c.loadBackup();

        expect(messages.add).toHaveBeenCalledWith([M.BACKUP_READ_ERROR_GENERIC]);
        done();
    });


    it('readDump: show success message', async done => {

        c.projectName = unittestdb;
        c.path = './package.json';
        await c.loadBackup();

        expect(messages.add).toHaveBeenCalledWith([M.BACKUP_READ_SUCCESS]);
        done();
    });


    it('readDump: create new project via settings', async done => {

        c.projectName = unittestdb;
        c.path = './package.json';
        await c.loadBackup();

        expect(settingsService.addProject).toHaveBeenCalledWith(unittestdb);
        done();
    });
});
