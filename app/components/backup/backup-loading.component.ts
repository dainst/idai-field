import {Component} from '@angular/core';
import {NgbModal, NgbModalRef} from '@ng-bootstrap/ng-bootstrap';
import {Messages} from 'idai-components-2';
import {M} from '../../m';
import {Backup} from './backup';
import {SettingsService} from '../../core/settings/settings-service';
import {ReadDumpModalComponent} from './read-dump-modal.component';
import {BackupProvider} from './backup-provider';


@Component({
    moduleId: module.id,
    templateUrl: './backup-loading.html'
})
/**
 * @author Thomas Kleinke
 * @author Daniel de Oliveira
 */
export class BackupLoadingComponent {

    public path: string;
    public projectName: string;

    private running: boolean = false;
    private modalRef: NgbModalRef|undefined;

    private static TIMEOUT: number = 200;


    constructor(
        private modalService: NgbModal,
        private messages: Messages,
        private settingsService: SettingsService,
        private backupProvider: BackupProvider
    ) {}


    public async loadBackup() {

        if (this.running) return;

        const errorMessage: string|undefined = this.validateInputs();
        if (errorMessage) return this.messages.add([errorMessage]);

        this.running = true;
        this.openModal();

        await this.readBackupFile();

        this.running = false;
        this.closeModal();
    }


    private validateInputs(): string|undefined {

        if (!this.projectName) return M.BACKUP_READ_DUMP_ERROR_NO_PROJECT_NAME;
        if (this.projectName === this.settingsService.getSelectedProject()) {
            return M.BACKUP_READ_DUMP_ERROR_SAME_PROJECT_NAME;
        }
        if (!this.path) return M.BACKUP_READ_DUMP_ERROR_FILE_NOT_EXIST;
    }


    private async readBackupFile() {

        try {
            await this.backupProvider.readDump(this.path, this.projectName);
            await this.settingsService.addProject(this.projectName);
            this.messages.add([M.BACKUP_READ_DUMP_SUCCESS]);
        } catch (err) {
            if (err === Backup.FILE_NOT_EXIST) {
                this.messages.add([M.BACKUP_READ_DUMP_ERROR_FILE_NOT_EXIST]);
            } else {
                this.messages.add([M.BACKUP_READ_DUMP_ERROR]);
                console.error('Error while reading backup file', err);
            }
        }
    }


    private openModal() {

        setTimeout(() => {
            if (this.running) this.modalRef = this.modalService.open(
                ReadDumpModalComponent,
                { backdrop: 'static', keyboard: false });
        }, BackupLoadingComponent.TIMEOUT);
    }


    private closeModal() {

        if (this.modalRef) this.modalRef.close();
        this.modalRef = undefined;
    }
}