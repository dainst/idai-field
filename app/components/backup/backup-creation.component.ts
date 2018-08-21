import {Component} from '@angular/core';
import {NgbModal, NgbModalRef} from '@ng-bootstrap/ng-bootstrap';
import {Messages} from 'idai-components-2';
import {M} from '../../m';
import {SettingsService} from '../../core/settings/settings-service';
import {DumpModalComponent} from './dump-modal.component';
import {DialogProvider} from './dialog-provider';
import {BackupProvider} from './backup-provider';


@Component({
    moduleId: module.id,
    templateUrl: './backup-creation.html'
})
/**
 * @author Thomas Kleinke
 * @author Daniel de Oliveira
 */
export class BackupCreationComponent {

    private running: boolean = false;
    private modalRef: NgbModalRef|undefined;

    private static TIMEOUT: number = 200;


    constructor(
        private dialogProvider: DialogProvider,
        private modalService: NgbModal,
        private messages: Messages,
        private settingsService: SettingsService,
        private backupProvider: BackupProvider
    ) {}


    public async createBackup() {

        if (this.running) return;

        const filePath = await this.dialogProvider.chooseFilepath();
        if (!filePath) return;

        this.running = true;
        this.openModal();

        await this.writeBackupFile(filePath);

        this.running = false;
        this.closeModal();
    }


    private async writeBackupFile(filePath: string) {

        try {
            await this.backupProvider.dump(filePath, this.settingsService.getSelectedProject());
            this.messages.add([M.BACKUP_DUMP_SUCCESS]);
        } catch (err) {
            this.messages.add([M.BACKUP_DUMP_ERROR]);
            console.error('Error while writing backup file', err);
        }
    }


    private openModal() {

        setTimeout(() => {
            if (this.running) {
                this.modalRef = this.modalService.open(
                    DumpModalComponent,
                    { backdrop: 'static', keyboard: false }
                );
            }
        }, BackupCreationComponent.TIMEOUT);
    }


    private closeModal() {

        if (this.modalRef) this.modalRef.close();
        this.modalRef = undefined;
    }
}