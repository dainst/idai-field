import { nop } from 'tsfun';
import { BackupLoadingComponent } from '../../../../src/app/components/backup/backup-loading.component';
import { M } from '../../../../src/app/components/messages/m';
import { ERROR_FILE_NOT_FOUND, ERROR_GENERIC } from '../../../../src/app/services/backup/backup-service';

const PouchDB = require('pouchdb-node');


/**
 * @author Daniel de Oliviera
 */
describe('BackupLoadingComponent', () => {

    const databaseName = 'unittestdb';

    let backupLoadingComponent: any;
    let messages: any;
    let settingsService: any;
    let backupService: any;


    beforeAll(() => {

        jest.spyOn(console, 'error').mockImplementation(nop);
    });


    beforeEach(() => {

        messages = {
            add: jest.fn()
        };
        
        settingsService = {
            addProject: jest.fn()
        };
        
        backupService = {
            create: jest.fn(),
            restore: jest.fn().mockReturnValue(Promise.resolve({ success: true }))
        };

        const modalService: any = {
            open: jest.fn()
        };

        const settingsProvider: any = {
            getSettings: jest.fn().mockReturnValue({ dbs: ['selectedproject'] })
        };
        
        const tabManager: any = {
            openActiveTab: jest.fn()
        };
        
        const menuService: any = {
            setContext: jest.fn()
        };

        backupLoadingComponent = new BackupLoadingComponent(
            modalService,
            messages,
            settingsProvider,
            settingsService,
            backupService,
            tabManager,
            menuService,
            undefined
        );
    });


    afterEach(async () => {

        await new PouchDB(databaseName).destroy();
    });


    afterAll(() => {

        (console.error as any).mockRestore();
    });


    test('load backup: project not specified', async () => {

        backupLoadingComponent.projectIdentifier = '';
        backupLoadingComponent.path = './test/store/backup_test_file.txt';
        await backupLoadingComponent.loadBackup();

        expect(messages.add).toHaveBeenCalledWith([M.BACKUP_READ_ERROR_NO_PROJECT_IDENTIFIER]);
    });


    test('load backup: file not exists', async () => {

        backupLoadingComponent.projectIdentifier = databaseName;
        backupLoadingComponent.path = './test/store/backup_test_file.txt';

        backupService.restore.mockReturnValue(Promise.resolve({ success: false, error: ERROR_FILE_NOT_FOUND }));
        await backupLoadingComponent.loadBackup();

        expect(messages.add).toHaveBeenCalledWith([M.BACKUP_READ_ERROR_FILE_NOT_FOUND]);
    });


    test('load backup: generic error', async () => {

        backupLoadingComponent.projectIdentifier = databaseName;
        backupLoadingComponent.path = './package.json';

        backupService.restore.mockReturnValue(Promise.resolve({ success: false, error: ERROR_GENERIC }));
        await backupLoadingComponent.loadBackup();

        expect(messages.add).toHaveBeenCalledWith([M.BACKUP_READ_ERROR_GENERIC]);
    });


    test('readDump: show success message', async () => {

        backupLoadingComponent.projectIdentifier = databaseName;
        backupLoadingComponent.path = './package.json';
        await backupLoadingComponent.loadBackup();

        expect(messages.add).toHaveBeenCalledWith([M.BACKUP_READ_SUCCESS]);
    });


    test('readDump: create new project via settings', async () => {

        backupLoadingComponent.projectIdentifier = databaseName;
        backupLoadingComponent.path = './package.json';
        await backupLoadingComponent.loadBackup();

        expect(settingsService.addProject).toHaveBeenCalledWith(databaseName);
    });
});
