import {Component} from '@angular/core';
import {Messages} from 'idai-components-2/core';
import {M} from '../../m';
import {Backup} from './backup';
import {SettingsService} from '../../core/settings/settings-service';
import {UploadModalComponent} from '../import/upload-modal.component';
import {NgbModal} from '@ng-bootstrap/ng-bootstrap';
import {DumpModalComponent} from './dump-modal.component';
import {ReadDumpModalComponent} from './read-dump-modal.component';

const {dialog} = require('electron').remote;


@Component({
    moduleId: module.id,
    templateUrl: './backup.html'
})
/**
 * @author Thomas Kleinke
 * @author Daniel de Oliveira
 */
export class BackupComponent {


    public path: string;
    public proj: string;
    private running = false;


    constructor(
        private messages: Messages,
        private modalService: NgbModal,
        private backup: Backup,
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
        }, 200);

        this.running = true;
        try {
            await this.backup.dump(filePath, this.settingsService.getSelectedProject());
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
        if (!this.proj) return;
        if (this.proj === this.settingsService.getSelectedProject()) {
            console.log("err - cannot be the same");
            return;
        }
        if (!this.path) return;

        let uploadModalRef: any = undefined;
        setTimeout(() => {
            if (this.running) uploadModalRef = this.modalService.open(ReadDumpModalComponent,
                { backdrop: 'static', keyboard: false });
        }, 200);

        this.running = true;
        try {
            await this.backup.readDump(this.path, this.proj);
            this.messages.add([M.BACKUP_READ_DUMP_SUCCESS]);
        } catch (err) {
            this.messages.add([M.BACKUP_READ_DUMP_ERROR]);
            console.error("err while read dump", err);
        }
        if(uploadModalRef) uploadModalRef.close();
        this.running = false;
    }


    private chooseFilepath(): Promise<string> {

        return new Promise<string>(async resolve => {

            const filePath = await dialog.showSaveDialog(
                { filters: [ { name: 'Text', extensions: [ 'txt' ] } ] });
            resolve(filePath);
        });
    }
}