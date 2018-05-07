import {BackupComponent} from '../../../../app/components/backup/backup.component';
import {M} from '../../../../app/m';

/**
 * @author Daniel de Oliviera
 */
describe('BackupComponent', () => {

    let c: BackupComponent;
    let messages: any;

    beforeEach(() => {

        const dialogProvider = jasmine.createSpyObj('dialogProvider', ['getDialog']);
        const modalService = jasmine.createSpyObj('modalService', ['open']);
        messages = jasmine.createSpyObj('messages', ['add']);
        const settingsService = jasmine.createSpyObj('settingsService', ['getSelectedProject']);

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

        c.proj = 'abc';
        c.path = './store/backup_test_file.txt';
        await c.readDump();

        expect(messages.add).toHaveBeenCalledWith([M.BACKUP_READ_DUMP_ERROR_FILE_NOT_EXIST]);
        done();
    });
});