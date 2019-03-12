import {BackupCreationComponent} from '../../../../app/components/backup/backup-creation.component';
import PouchDB = require('pouchdb');

/**
 * @author Daniel de Oliviera
 */
describe('BackupCreationComponent', () => {

    const backupFilePath = 'store/backup_test_file.txt';
    const unittestdb = 'unittestdb';

    let c: BackupCreationComponent;
    let messages: any;
    let settingsService: any;
    let backupProvider: any;
    let tabManager: any;


    afterEach(done => new PouchDB(unittestdb).destroy().then(done));


    beforeEach(() => {

        spyOn(console, 'warn');

        const dialogProvider = jasmine.createSpyObj('dialogProvider', ['chooseFilepath']);
        const modalService = jasmine.createSpyObj('modalService', ['open']);
        messages = jasmine.createSpyObj('messages', ['add']);
        settingsService = jasmine.createSpyObj('settingsService', ['getSelectedProject', 'addProject']);
        backupProvider = jasmine.createSpyObj('backupProvider', ['dump', 'readDump']);
        tabManager = jasmine.createSpyObj('tabManager', ['returnToLastResourcesRoute']);

        c = new BackupCreationComponent(
            dialogProvider,
            modalService,
            messages,
            settingsService,
            backupProvider,
            tabManager
        );

        settingsService.getSelectedProject.and.returnValue('selectedproject');
        dialogProvider.chooseFilepath.and.returnValue(Promise.resolve(backupFilePath));
    });


    it('create backup', async done => {

        await c.createBackup();
        expect(backupProvider.dump).toHaveBeenCalledWith(backupFilePath, 'selectedproject');

        done();
    });
});