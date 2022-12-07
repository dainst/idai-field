import { Component } from '@angular/core';
import { NgbModal, NgbModalRef } from '@ng-bootstrap/ng-bootstrap';
import { Backup } from './backup';
import { SettingsService } from '../../services/settings/settings-service';
import { BackupLoadingModalComponent } from './backup-loading-modal.component';
import { BackupProvider } from './backup-provider';
import { M } from '../messages/m';
import { ProjectNameValidation } from '../../model/project-name-validation';
import { TabManager } from '../../services/tabs/tab-manager';
import { ProjectNameValidatorMsgConversion } from '../messages/project-name-validator-msg-conversion';
import { Messages } from '../messages/messages';
import { SettingsProvider } from '../../services/settings/settings-provider';
import { MsgWithParams } from '../messages/msg-with-params';
import { Menus } from '../../services/menus';
import { MenuContext } from '../../services/menu-context';


@Component({
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
        private settingsProvider: SettingsProvider,
        private settingsService: SettingsService,
        private backupProvider: BackupProvider,
        private tabManager: TabManager,
        private menuService: Menus
    ) {}


    public async onKeyDown(event: KeyboardEvent) {

        if (event.key === 'Escape' && this.menuService.getContext() === MenuContext.DEFAULT) {
            await this.tabManager.openActiveTab();
        }
    }


    public async loadBackup() {

        if (this.running) return;

        const errorMessage: MsgWithParams|undefined = this.validateInputs();
        if (errorMessage) return this.messages.add(errorMessage);

        this.running = true;
        this.menuService.setContext(MenuContext.MODAL);
        this.openModal();

        await this.readBackupFile();

        this.running = false;
        this.menuService.setContext(MenuContext.DEFAULT);
        this.closeModal();
    }


    private validateInputs(): MsgWithParams|undefined {

        if (!this.path) return [M.BACKUP_READ_ERROR_FILE_NOT_FOUND];
        if (!this.projectName) return [M.BACKUP_READ_ERROR_NO_PROJECT_NAME];
        if (this.projectName === this.settingsProvider.getSettings().selectedProject) {
            return [M.BACKUP_READ_ERROR_SAME_PROJECT_NAME];
        }

        return ProjectNameValidatorMsgConversion.convert(
            ProjectNameValidation.validate(this.projectName)
        );
    }


    private async readBackupFile() {

        try {
            const warnings: MsgWithParams[] = await this.backupProvider.readDump(this.path, this.projectName) as any;
            await this.settingsService.addProject(this.projectName);
            if (warnings) warnings.forEach(warning => this.messages.add(warning));
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
                { backdrop: 'static', keyboard: false, animation: false });
        }, BackupLoadingComponent.TIMEOUT);
    }


    private closeModal() {

        if (this.modalRef) this.modalRef.close();
        this.modalRef = undefined;
    }
}
