import { AfterViewChecked, Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { clone, equal, flatten } from 'tsfun';
import { M } from '../messages/m';
import { TabManager } from '../../services/tabs/tab-manager';
import { Messages } from '../messages/messages';
import { reload } from '../../services/reload';
import { Settings } from '../../services/settings/settings';
import { SettingsProvider } from '../../services/settings/settings-provider';
import { SettingsService } from '../../services/settings/settings-service';
import { Menus } from '../../services/menus';
import { MenuContext } from '../../services/menu-context';
import { SettingsErrors } from '../../services/settings/settings-errors';
import { AngularUtility } from '../../angular/angular-utility';
import { KeepBackupsSettings } from '../../services/settings/keep-backups-settings';
import { Backup } from '../../services/backup/model/backup';
import { getExistingBackups } from '../../services/backup/auto-backup/get-existing-backups';
import { BackupsMap } from '../../services/backup/model/backups-map';
import { getFileSizeLabel } from '../../util/get-file-size-label';

const address = window.require('address');
const remote = window.require('@electron/remote');


@Component({
    templateUrl: './settings.html',
    host: {
        '(window:keydown)': 'onKeyDown($event)'
    },
    standalone: false
})
/**
 * @author Daniel de Oliveira
 * @author Sebastian Cuy
 * @author Thomas Kleinke
 */
export class SettingsComponent implements OnInit, AfterViewChecked {

    @ViewChild('settingsContainer') settingsContainer: ElementRef;
    @ViewChild('advancedSettingsButton') advancedSettingsButton: ElementRef;

    public settings: Settings;
    public originalKeepBackupSettings: KeepBackupsSettings;
    public ipAddress: string = address.ip();
    public saving: boolean = false;
    public advancedSettingsCollapsed: boolean = true;
    public isLinux: boolean;
    public existingBackupsSizeLabel: string;
    public estimatedBackupsSizeLabel: string;

    private existingBackups: Array<Backup> = [];
    private existingBackupsSize: number;
    private backedUpProjects: string[] = [];
    private scrollToAdvancedSettings: boolean = false;
    private scrollToBottom: boolean = false;


    constructor(private settingsProvider: SettingsProvider,
                private settingsService: SettingsService,
                private messages: Messages,
                private tabManager: TabManager,
                private menuService: Menus,
                private decimalPipe: DecimalPipe) {

        this.settingsProvider.settingsChangesNotifications().subscribe(settings => this.settings = settings);
    }


    public hasCustomBackups = () => this.settings.keepBackups.custom > 0 && this.settings.keepBackups.customInterval > 0;

    public hasDailyBackups = () => this.settings.keepBackups.daily > 0;

    public hasWeeklyBackups = () => this.settings.keepBackups.weekly > 0;

    public hasMonthlyBackups = () => this.settings.keepBackups.monthly > 0;


    ngOnInit() {

        this.isLinux = remote.getGlobal('os') === 'Linux';
        this.settings = this.settingsProvider.getSettings();
        this.originalKeepBackupSettings = clone(this.settings.keepBackups);

        this.initializeBackupValues();
    }


    ngAfterViewChecked() {

        if (this.scrollToBottom) {
            this.settingsContainer.nativeElement.scrollTo(0, this.settingsContainer.nativeElement.scrollHeight);
            this.scrollToBottom = false;
        }

        if (this.scrollToAdvancedSettings) {
            this.advancedSettingsButton.nativeElement.scrollIntoView();
            this.scrollToAdvancedSettings = false;
        }
    }


    public async onKeyDown(event: KeyboardEvent) {

        if (event.key === 'Escape' && this.menuService.getContext() === MenuContext.DEFAULT) {
            await this.tabManager.openActiveTab();
        }
    }


    public toggleAutoUpdate() {

        this.settings.isAutoUpdateActive = !this.settings.isAutoUpdateActive;
    }


    public toggleAllowUploads() {

        this.settings.allowLargeFileUploads = !this.settings.allowLargeFileUploads;
    }


    public toggleAdvancedSettings() {

        this.advancedSettingsCollapsed = !this.advancedSettingsCollapsed;
        if (!this.advancedSettingsCollapsed) this.scrollToAdvancedSettings = true;
    }


    public setKeepBackupsValue(type: 'custom'|'customInterval'|'daily'|'weekly'|'monthly', value: number) {

        this.settings.keepBackups[type] = Math.min(1000000, Math.max(0, value));
        this.scrollToBottom = true;
        this.estimatedBackupsSizeLabel = this.getEstimatedSizeLabel();
    }


    public async save() {

        AngularUtility.blurActiveElement();

        this.saving = true;
        const languagesChanged: boolean
            = !equal(this.settings.languages)(this.settingsProvider.getSettings().languages);

        try {
            await this.settingsService.updateSettings(this.settings, 'settings');
        } catch (err) {
            this.saving = false;
            if (err === SettingsErrors.MISSING_USERNAME) {
                this.messages.add([M.SETTINGS_ERROR_MISSING_USERNAME]);
            } else {
                console.error(err);
            }
            return;
        }

        await this.handleSaveSuccess(languagesChanged);
    }


    public async chooseDirectoryPath(type: 'imagestorePath'|'backupDirectoryPath') {

        const result: any = await remote.dialog.showOpenDialog(
            remote.getCurrentWindow(),
            {
                properties: ['openDirectory', 'createDirectory'],
                defaultPath: this.settings[type]
            }
        );

        if (result && result.filePaths.length > 0) {
            this.settings[type] = result.filePaths[0];
        }
    }


    public isKeepBackupsWarningVisible(): boolean {

        if (!this.backedUpProjects.length) return false;

        if (this.originalKeepBackupSettings.customInterval !== 0
            && this.originalKeepBackupSettings.customInterval !== this.settings.keepBackups.customInterval) {
            return true;
        } else {
            return this.originalKeepBackupSettings.custom > this.settings.keepBackups.custom
                || this.originalKeepBackupSettings.daily > this.settings.keepBackups.daily
                || this.originalKeepBackupSettings.weekly > this.settings.keepBackups.weekly
                || this.originalKeepBackupSettings.monthly > this.settings.keepBackups.monthly;
        }
    }


    private getEstimatedSizeLabel(): string {

        const futureBackupsCount: number = SettingsComponent.getFileCount(this.settings.keepBackups);
        const averageBackupSize: number = this.existingBackups.length
            ? this.existingBackupsSize / this.existingBackups.length
            : 0;
        const estimatedSize: number = averageBackupSize * futureBackupsCount * this.backedUpProjects.length;

        return getFileSizeLabel(estimatedSize, (value) => this.decimalPipe.transform(value));
    }


    private async handleSaveSuccess(languagesChanged: boolean) {

        this.originalKeepBackupSettings = clone(this.settings.keepBackups);

        if (languagesChanged) {
            reload();
        } else {
            try {
                await this.settingsService.setupSync();
                this.messages.add([M.SETTINGS_SUCCESS]);
            } catch (err) {
                console.error(err);
            } finally {
                this.saving = false;
            }
        }
    }


    private initializeBackupValues() {

        const backupsMap: BackupsMap = getExistingBackups(this.settings.backupDirectoryPath, true);

        this.existingBackups = flatten(Object.values(backupsMap));
        this.backedUpProjects = Object.keys(backupsMap);
        this.existingBackupsSize = this.getExistingBackupsSize();
        this.existingBackupsSizeLabel = this.getExistingBackupsSizeLabel();
        this.estimatedBackupsSizeLabel = this.getEstimatedSizeLabel();
    }


    private getExistingBackupsSize(): number {
        
        return this.existingBackups.reduce((result, backup) => result + backup.size, 0);
    }


    private getExistingBackupsSizeLabel(): string {

        return getFileSizeLabel(this.existingBackupsSize, (value) => this.decimalPipe.transform(value));
    }


    private static getFileCount(keepBackupsSettings: KeepBackupsSettings): number {
        
        return keepBackupsSettings.custom
            + keepBackupsSettings.daily
            + keepBackupsSettings.weekly
            + keepBackupsSettings.monthly
            + 1;
    }
}
