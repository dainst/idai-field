import { Component } from '@angular/core';
import { NgbModal, NgbModalRef } from '@ng-bootstrap/ng-bootstrap';
import { BackupCreationModalComponent } from './backup-creation-modal.component';
import { DialogProvider } from './dialog-provider';
import { M } from '../messages/m';
import { TabManager } from '../../services/tabs/tab-manager';
import { Messages } from '../messages/messages';
import { SettingsProvider } from '../../services/settings/settings-provider';
import { Menus } from '../../services/menus';
import { MenuContext } from '../../services/menu-context';
import { AppState } from '../../services/app-state';
import { AngularUtility } from '../../angular/angular-utility';
import { BackupService } from '../../services/backup/backup-service';


@Component({
    templateUrl: './backup-creation.html',
    host: {
        '(window:keydown)': 'onKeyDown($event)'
    },
    standalone: false
})
/**
 * @author Thomas Kleinke
 * @author Daniel de Oliveira
 */
export class BackupCreationComponent {

    public running: boolean = false;

    private modalRef: NgbModalRef|undefined;

    private static TIMEOUT: number = 200;


    constructor(private dialogProvider: DialogProvider,
                private modalService: NgbModal,
                private messages: Messages,
                private settingsProvider: SettingsProvider,
                private backupService: BackupService,
                private tabManager: TabManager,
                private menuService: Menus,
                private appState: AppState) {}


    public async onKeyDown(event: KeyboardEvent) {

        if (event.key === 'Escape' && this.menuService.getContext() === MenuContext.DEFAULT) {
            await this.tabManager.openActiveTab();
        }
    }


    public async startBackupCreation() {

        if (this.running) return;

        const projectName: string = this.settingsProvider.getSettings().selectedProject;

        const filePath = await this.dialogProvider.chooseFilepath(projectName, this.appState);
        AngularUtility.blurActiveElement();
        if (!filePath) return;

        this.running = true;
        this.menuService.setContext(MenuContext.MODAL);
        this.openModal();

        await this.writeBackupFile(filePath, projectName);

        this.running = false;
        this.menuService.setContext(MenuContext.DEFAULT);
        this.closeModal();
    }


    private async writeBackupFile(filePath: string, projectName: string) {

        const success: boolean = await this.backupService.create(filePath, projectName);

        if (success) {
            this.messages.add([M.BACKUP_WRITE_SUCCESS]);
        } else {
            this.messages.add([M.BACKUP_WRITE_ERROR_GENERIC]);
        }
    }


    private openModal() {

        setTimeout(() => {
            if (this.running) {
                this.modalRef = this.modalService.open(
                    BackupCreationModalComponent,
                    { backdrop: 'static', keyboard: false, animation: false }
                );
            }
        }, BackupCreationComponent.TIMEOUT);
    }


    private closeModal() {

        if (this.modalRef) this.modalRef.close();
        this.modalRef = undefined;
    }
}
