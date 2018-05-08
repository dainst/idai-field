import {BackupComponent} from '../../../../app/components/backup/backup.component';
import {M} from '../../../../app/m';
import PouchDB = require('pouchdb');
import fs = require('fs');
import rimraf = require('rimraf');

/**
 * @author Daniel de Oliviera
 */
describe('BackupComponent', () => {

    const backupFilePath = 'store/backup_test_file.txt';
    const unittestdb = 'unittestdb';

    let c: BackupComponent;
    let messages: any;
    let settingsService: any;


    afterEach(done => rimraf(backupFilePath,
        () => new PouchDB(unittestdb).destroy().then(done)));


    beforeEach(() => {

        spyOn(console, 'warn');

        const dialogProvider = jasmine.createSpyObj('dialogProvider', ['chooseFilepath']);
        const modalService = jasmine.createSpyObj('modalService', ['open']);
        messages = jasmine.createSpyObj('messages', ['add']);
        settingsService = jasmine.createSpyObj('settingsService', ['getSelectedProject', 'addProject']);

        c = new BackupComponent(
            dialogProvider,
            modalService,
            messages,
            settingsService
        );

        settingsService.getSelectedProject.and.returnValue('selectedproject');
        dialogProvider.chooseFilepath.and.returnValue(Promise.resolve(backupFilePath));
    });


    it('dump', async done => {

        const db = new PouchDB(unittestdb);
        await db.put({'_id' : 'a1', a: {b: 'c'}});
        await db.close();

        settingsService.getSelectedProject.and.returnValue(unittestdb);
        await c.dump();
        const data = fs.readFileSync(backupFilePath);
        const docs = JSON.parse(data.toString().split('\n')[1])['docs'];
        expect(docs[0].a.b).toEqual('c');
        done();
    });


    it('readDump: project not specified', async done => {

        c.proj = '';
        c.path = './store/backup_test_file.txt';
        await c.readDump();

        expect(messages.add).toHaveBeenCalledWith([M.BACKUP_READ_DUMP_ERROR_NO_PROJECT_NAME]);
        done();
    });


    it('readDump: filenotexists', async done => {

        c.proj = unittestdb;
        c.path = './store/backup_test_file.txt';
        await c.readDump();

        expect(messages.add).toHaveBeenCalledWith([M.BACKUP_READ_DUMP_ERROR_FILE_NOT_EXIST]);
        done();
    });


    it('reaadDump: cannotreaddb', async done => {

        spyOn(console, 'error');

        c.proj = unittestdb;
        c.path = './package.json';
        await c.readDump();

        expect(messages.add).toHaveBeenCalledWith([M.BACKUP_READ_DUMP_ERROR]);
        done();
    });
});