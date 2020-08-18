import {Component} from '@angular/core';
import {NgbModal, NgbModalRef} from '@ng-bootstrap/ng-bootstrap';
import {SettingsService} from '../../core/settings/settings-service';
import {BackupCreationModalComponent} from './backup-creation-modal.component';
import {DialogProvider} from './dialog-provider';
import {BackupProvider} from './backup-provider';
import {M} from '../messages/m';
import {TabManager} from '../../core/tabs/tab-manager';
import {Messages} from '../messages/messages';
import {MenuService} from '../menu-service';


@Component({
    templateUrl: './backup-creation.html',
    host: {
        '(window:keydown)': 'onKeyDown($event)'
    }
})
/**
 * @author Thomas Kleinke
 * @author Daniel de Oliveira
 */
export class BackupCreationComponent {

    public running: boolean = false;

    private modalRef: NgbModalRef|undefined;

    private static TIMEOUT: number = 200;


    constructor(
        private dialogProvider: DialogProvider,
        private modalService: NgbModal,
        private messages: Messages,
        private settingsService: SettingsService,
        private backupProvider: BackupProvider,
        private tabManager: TabManager,
        private menuService: MenuService
    ) {}


    public async onKeyDown(event: KeyboardEvent) {

        if (event.key === 'Escape') await this.tabManager.openActiveTab();
    }


    public async createBackup() {

        if (this.running) return;

        const filePath = await this.dialogProvider.chooseFilepath();
        if (!filePath) return;

        this.running = true;
        this.menuService.setContext('modal');
        this.openModal();

        await this.writeBackupFile(filePath);

        this.running = false;
        this.menuService.setContext('default');
        this.closeModal();
    }


    private async writeBackupFile(filePath: string) {

        try {
            await this.backupProvider.dump(filePath, this.settingsService.getSelectedProject());
            this.messages.add([M.BACKUP_WRITE_SUCCESS]);
        } catch (err) {
            this.messages.add([M.BACKUP_WRITE_ERROR_GENERIC]);
            console.error('Error while writing backup file', err);
        }
    }


    private openModal() {

        setTimeout(() => {
            if (this.running) {
                this.modalRef = this.modalService.open(
                    BackupCreationModalComponent,
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
