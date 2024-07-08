import { describe, test, beforeAll, beforeEach, afterEach, afterAll, jest } from '@jest/globals';
import { nop } from 'tsfun';
import { BackupLoadingComponent } from '../../../../src/app/components/backup/backup-loading.component';
import { Backup } from '../../../../src/app/components/backup/backup';
import { M } from '../../../../src/app/components/messages/m';

import PouchDB = require('pouchdb-node');


/**
 * @author Daniel de Oliviera
 */
describe('BackupLoadingComponent', () => {

    const databaseName = 'unittestdb';

    let backupLoadingComponent: BackupLoadingComponent;
    let messages: any;
    let settingsService: any;
    let backupProvider: any;


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
        
        backupProvider = {
            dump: jest.fn(),
            readDump: jest.fn()
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
            backupProvider,
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


    test('load backup: filenotexists', async () => {

        backupLoadingComponent.projectIdentifier = databaseName;
        backupLoadingComponent.path = './test/store/backup_test_file.txt';

        backupProvider.readDump.mockReturnValue(Promise.reject(Backup.FILE_NOT_EXIST));
        await backupLoadingComponent.loadBackup();

        expect(messages.add).toHaveBeenCalledWith([M.BACKUP_READ_ERROR_FILE_NOT_FOUND]);
    });


    test('load backup: cannotreaddb', async () => {

        backupLoadingComponent.projectIdentifier = databaseName;
        backupLoadingComponent.path = './package.json';

        backupProvider.readDump.mockReturnValue(Promise.reject('reason'));
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
