import {BackupComponent} from '../../../../app/components/backup/backup.component';
import {M} from '../../../../app/m';
import PouchDB = require('pouchdb');

/**
 * @author Daniel de Oliviera
 */
describe('BackupComponent', () => {

    const unittestdb = 'unittestdb';

    let c: BackupComponent;
    let messages: any;


    afterEach(done => new PouchDB(unittestdb).destroy().then(done));


    beforeEach(() => {

        const dialogProvider = jasmine.createSpyObj('dialogProvider', ['getDialog']);
        const modalService = jasmine.createSpyObj('modalService', ['open']);
        messages = jasmine.createSpyObj('messages', ['add']);
        const settingsService = jasmine.createSpyObj('settingsService', ['getSelectedProject', 'addProject']);

        c = new BackupComponent(
            dialogProvider,
            modalService,
            messages,
            settingsService
        );

        settingsService.getSelectedProject.and.returnValue('testproject');
    });


    it('project not specified', async done => {

        c.proj = '';
        c.path = './store/backup_test_file.txt';
        await c.readDump();

        expect(messages.add).toHaveBeenCalledWith([M.BACKUP_READ_DUMP_ERROR_NO_PROJECT_NAME]);
        done();
    });


    it('filenotexists', async done => {

        c.proj = unittestdb;
        c.path = './store/backup_test_file.txt';
        await c.readDump();

        expect(messages.add).toHaveBeenCalledWith([M.BACKUP_READ_DUMP_ERROR_FILE_NOT_EXIST]);
        done();
    });


    it('cannotreaddb', async done => {

        spyOn(console, 'error');

        c.proj = unittestdb;
        c.path = './package.json';
        await c.readDump();

        expect(messages.add).toHaveBeenCalledWith([M.BACKUP_READ_DUMP_ERROR]);
        done();
    });
});