import {Component} from '@angular/core';
import {NgbModal, NgbModalRef} from '@ng-bootstrap/ng-bootstrap';
import {Messages} from 'idai-components-2';
import {Backup} from './backup';
import {SettingsService} from '../../core/settings/settings-service';
import {BackupLoadingModalComponent} from './backup-loading-modal.component';
import {BackupProvider} from './backup-provider';
import {M} from '../m';
import {ProjectNameValidator} from '../../common/project-name-validator';
import {TabManager} from '../tab-manager';


@Component({
    moduleId: module.id,
    templateUrl: './backup-loading.html',
    host: {
        '(window:keydown)': 'onKeyDown($event)'
    }
})
/**
 * @author Thomas Kleinke
 * @author Daniel de Oliveira
 */
export class BackupLoadingComponent {

    public running: boolean = false;
    public path: string;
    public projectName: string;

    private modalRef: NgbModalRef|undefined;

    private static TIMEOUT: number = 200;


    constructor(
        private modalService: NgbModal,
        private messages: Messages,
        private settingsService: SettingsService,
        private backupProvider: BackupProvider,
        private tabManager: TabManager
    ) {}


    public async onKeyDown(event: KeyboardEvent) {

        if (event.key === 'Escape') await this.tabManager.openActiveTab();
    }


    public async loadBackup() {

        if (this.running) return;

        const errorMessage: string[]|undefined = this.validateInputs();
        if (errorMessage) return this.messages.add(errorMessage);

        this.running = true;
        this.openModal();

        await this.readBackupFile();

        this.running = false;
        this.closeModal();
    }


    private validateInputs(): string[]|undefined {

        if (!this.path) return [M.BACKUP_READ_ERROR_FILE_NOT_FOUND];
        if (!this.projectName) return [M.BACKUP_READ_ERROR_NO_PROJECT_NAME];
        if (this.projectName === this.settingsService.getSelectedProject()) {
            return [M.BACKUP_READ_ERROR_SAME_PROJECT_NAME];
        }

        return ProjectNameValidator.validate(this.projectName);
    }


    private async readBackupFile() {

        try {
            await this.backupProvider.readDump(this.path, this.projectName);
            await this.settingsService.addProject(this.projectName);
            this.messages.add([M.BACKUP_READ_SUCCESS]);
        } catch (err) {
            if (err === Backup.FILE_NOT_EXIST) {
                this.messages.add([M.BACKUP_READ_ERROR_FILE_NOT_FOUND]);
            } else {
                this.messages.add([M.BACKUP_READ_ERROR_GENERIC]);
                console.error('Error while reading backup file', err);
            }
        }
    }


    private openModal() {

        setTimeout(() => {
            if (this.running) this.modalRef = this.modalService.open(
                BackupLoadingModalComponent,
                { backdrop: 'static', keyboard: false });
        }, BackupLoadingComponent.TIMEOUT);
    }


    private closeModal() {

        if (this.modalRef) this.modalRef.close();
        this.modalRef = undefined;
    }
}