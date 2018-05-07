import {Component} from '@angular/core';
import {Messages} from 'idai-components-2/core';
import {M} from '../../m';
import {Backup} from './backup';
import {SettingsService} from '../../core/settings/settings-service';
import {NgbModal} from '@ng-bootstrap/ng-bootstrap';
import {DumpModalComponent} from './dump-modal.component';
import {ReadDumpModalComponent} from './read-dump-modal.component';
import {DialogProvider} from './dialog-provider';




@Component({
    moduleId: module.id,
    templateUrl: './backup.html'
})
/**
 * @author Thomas Kleinke
 * @author Daniel de Oliveira
 */
export class BackupComponent {

    private static TIMEOUT = 200;

    private running = false;

    public path: string;
    public proj: string;


    constructor(
        private dialogProvider: DialogProvider,
        private modalService: NgbModal,
        private messages: Messages,
        private settingsService: SettingsService
    ) {}


    public async dump() {

        if (this.running) return;
        const filePath = await this.chooseFilepath();
        if (!filePath) return;

        let uploadModalRef: any = undefined;
        setTimeout(() => {
            if (this.running) uploadModalRef = this.modalService.open(DumpModalComponent,
                { backdrop: 'static', keyboard: false });
        }, BackupComponent.TIMEOUT);

        this.running = true;
        try {
            await Backup.dump(filePath, this.settingsService.getSelectedProject());
            this.messages.add([M.BACKUP_DUMP_SUCCESS]);
        } catch (err) {
            this.messages.add([M.BACKUP_DUMP_ERROR]);
            console.error("err while dump", err);
        }

        if(uploadModalRef) uploadModalRef.close();
        this.running = false;
    }


    public async readDump() {

        if (this.running) return;
        if (!this.proj) return this.messages.add([M.BACKUP_READ_DUMP_ERROR_NO_PROJECT_NAME]);
        if (this.proj === this.settingsService.getSelectedProject()) {
            return this.messages.add([M.BACKUP_READ_DUMP_ERROR_SAME_PROJECT_NAME]);
        }

        if (!this.path) return this.messages.add([M.BACKUP_READ_DUMP_ERROR_FILE_NOT_EXIST]);

        let uploadModalRef: any = undefined;
        setTimeout(() => {
            if (this.running) uploadModalRef = this.modalService.open(ReadDumpModalComponent,
                { backdrop: 'static', keyboard: false });
        }, BackupComponent.TIMEOUT);

        this.running = true;
        try {
            await Backup.readDump(this.path, this.proj);
            this.messages.add([M.BACKUP_READ_DUMP_SUCCESS]);
        } catch (err) {
            if (err === Backup.FILE_NOT_EXIST) {
                this.messages.add([M.BACKUP_READ_DUMP_ERROR_FILE_NOT_EXIST]);
            } else {
                this.messages.add([M.BACKUP_READ_DUMP_ERROR]);
                console.error("err while read dump", err);
            }
        }
        if(uploadModalRef) uploadModalRef.close();
        this.running = false;
    }


    private chooseFilepath(): Promise<string> {

        return new Promise<string>(async resolve => {

            const filePath = await this.dialogProvider.getDialog().showSaveDialog(
                { filters: [ { name: 'Text', extensions: [ 'txt' ] } ] });
            resolve(filePath);
        });
    }
}