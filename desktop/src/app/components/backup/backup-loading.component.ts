import { Component } from '@angular/core';
import { NgbModal, NgbModalRef } from '@ng-bootstrap/ng-bootstrap';
import { SettingsService } from '../../services/settings/settings-service';
import { BackupLoadingModalComponent } from './backup-loading-modal.component';
import { M } from '../messages/m';
import { ProjectIdentifierValidation } from '../../model/project-identifier-validation';
import { TabManager } from '../../services/tabs/tab-manager';
import { ProjectIdentifierValidatorMessagesConversion } from '../messages/project-identifier-validator-messages-conversion';
import { Messages } from '../messages/messages';
import { SettingsProvider } from '../../services/settings/settings-provider';
import { MsgWithParams } from '../messages/msg-with-params';
import { Menus } from '../../services/menus';
import { MenuContext } from '../../services/menu-context';
import { AppState } from '../../services/app-state';
import { AngularUtility } from '../../angular/angular-utility';
import { BackupService, ERROR_FILE_NOT_FOUND, RestoreBackupResult } from '../../services/backup/backup-service';

const remote = window.require('@electron/remote');


@Component({
    templateUrl: './backup-loading.html',
    host: {
        '(window:keydown)': 'onKeyDown($event)'
    },
    standalone: false
})
/**
 * @author Thomas Kleinke
 * @author Daniel de Oliveira
 */
export class BackupLoadingComponent {

    public running: boolean = false;
    public path: string;
    public projectIdentifier: string;

    private modalRef: NgbModalRef|undefined;

    private static TIMEOUT: number = 200;


    constructor(private modalService: NgbModal,
                private messages: Messages,
                private settingsProvider: SettingsProvider,
                private settingsService: SettingsService,
                private backupService: BackupService,
                private tabManager: TabManager,
                private menuService: Menus,
                private appState: AppState) {}


    public async onKeyDown(event: KeyboardEvent) {

        if (event.key === 'Escape' && this.menuService.getContext() === MenuContext.DEFAULT) {
            await this.tabManager.openActiveTab();
        }
    }


    public async selectFile() {

        const result: any = await remote.dialog.showOpenDialog(
            remote.getCurrentWindow(),
            {
                properties: ['openFile'],
                defaultPath: this.appState.getFolderPath('backupLoading'),
                buttonLabel: $localize `:@@openFileDialog.select:Auswählen`,
                filters: [
                    {
                        name: 'JSON Lines',
                        extensions: ['jsonl']
                    }
                ]
            }
        );

        if (result.filePaths.length) {
            this.path = result.filePaths[0];
            this.appState.setFolderPath(this.path, 'backupLoading');
        }
    }


    public async loadBackup() {

        AngularUtility.blurActiveElement();

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
        if (!this.projectIdentifier) return [M.BACKUP_READ_ERROR_NO_PROJECT_IDENTIFIER];
        if (this.projectIdentifier === this.settingsProvider.getSettings().selectedProject) {
            return [M.BACKUP_READ_ERROR_SAME_PROJECT_IDENTIFIER];
        }

        return ProjectIdentifierValidatorMessagesConversion.convert(
            ProjectIdentifierValidation.validate(this.projectIdentifier)
        );
    }


    private async readBackupFile() {

        const result: RestoreBackupResult = await this.backupService.restore(
            this.path, this.projectIdentifier, this.settingsService
        );

        if (result.success) {
            await this.settingsService.addProject(this.projectIdentifier);
            if (result.unsimilarProjectIdentifier) {
                this.messages.add([M.BACKUP_READ_WARNING_UNSIMILAR_PROJECT_IDENTIFIER]);
            }
            this.messages.add([M.BACKUP_READ_SUCCESS]);
        } else if (result.error === ERROR_FILE_NOT_FOUND) {
            this.messages.add([M.BACKUP_READ_ERROR_FILE_NOT_FOUND]);
        } else {
            this.messages.add([M.BACKUP_READ_ERROR_GENERIC]);
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
