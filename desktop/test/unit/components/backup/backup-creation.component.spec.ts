import { describe, test, beforeEach } from '@jest/globals';
import { BackupCreationComponent } from '../../../../src/app/components/backup/backup-creation.component';


/**
 * @author Daniel de Oliviera
 */
describe('BackupCreationComponent', () => {

    const backupFilePath = 'test/store/backup_test_file.txt';

    let backupCreationComponent: BackupCreationComponent;
    let backupProvider: any;


    beforeEach(() => {

        backupProvider = {
            dump: jest.fn(),
            readDump: jest.fn()
        };

        const dialogProvider: any = {
            chooseFilepath: jest.fn()
        };

        const modalService: any = {
            open: jest.fn()
        };

        const messages: any = {
            add: jest.fn()
        };

        const settingsService: any = {
            getSettings: jest.fn(),
            addProject: jest.fn()
        };

        const tabManager: any = {
            openActiveTab: jest.fn()
        };

        const menuService: any = {
            setContext: jest.fn()
        };

        backupCreationComponent = new BackupCreationComponent(
            dialogProvider,
            modalService,
            messages,
            settingsService,
            backupProvider,
            tabManager,
            menuService,
            undefined
        );

        settingsService.getSettings.mockReturnValue({ selectedProject: 'selected-project' } as any);
        dialogProvider.chooseFilepath.mockReturnValue(Promise.resolve(backupFilePath));
    });


    test('create backup', async () => {

        await backupCreationComponent.createBackup();
        expect(backupProvider.dump).toHaveBeenCalledWith(backupFilePath, 'selected-project');
    });
});
