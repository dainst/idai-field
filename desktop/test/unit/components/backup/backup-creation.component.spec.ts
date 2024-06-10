import { BackupCreationComponent } from '../../../../src/app/components/backup/backup-creation.component';

import PouchDB = require('pouchdb-node');


/**
 * @author Daniel de Oliviera
 */
describe('BackupCreationComponent', () => {

    const backupFilePath = 'test/store/backup_test_file.txt';
    const unittestdb = 'unittestdb';

    let c: BackupCreationComponent;
    let messages: any;
    let settingsService: any;
    let backupProvider: any;
    let tabManager: any;
    let menuService: any;


    beforeEach(() => {

        spyOn(console, 'warn');

        const dialogProvider = jasmine.createSpyObj('dialogProvider', ['chooseFilepath']);
        const modalService = jasmine.createSpyObj('modalService', ['open']);
        messages = jasmine.createSpyObj('messages', ['add']);
        settingsService = jasmine.createSpyObj('settingsService', ['getSettings', 'addProject']);
        backupProvider = jasmine.createSpyObj('backupProvider', ['dump', 'readDump']);
        tabManager = jasmine.createSpyObj('tabManager', ['openActiveTab']);
        menuService = jasmine.createSpyObj('menuService', ['setContext']);

        c = new BackupCreationComponent(
            dialogProvider,
            modalService,
            messages,
            settingsService,
            backupProvider,
            tabManager,
            menuService,
            undefined
        );

        settingsService.getSettings.and.returnValue({ selectedProject: 'selectedproject' } as any);
        dialogProvider.chooseFilepath.and.returnValue(Promise.resolve(backupFilePath));
    });


    afterEach(done => new PouchDB(unittestdb).destroy().then(done));


    it('create backup', async done => {

        await c.createBackup();
        expect(backupProvider.dump).toHaveBeenCalledWith(backupFilePath, 'selectedproject');

        done();
    });
});
