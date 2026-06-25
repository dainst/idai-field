import { AfterViewChecked, Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { Datastore, Document, ProjectConfiguration } from 'idai-field-core';
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
import {
    KOREAN_FIELDWORK_DEFAULT_INVESTIGATION_MODE,
    KOREAN_FIELDWORK_PROJECT_BOUNDARY_SUMMARY_FIELD,
    KOREAN_FIELDWORK_PROJECT_INVESTIGATION_MODE_FIELD,
    KOREAN_FIELDWORK_INVESTIGATION_MODES,
    createKoreanFieldworkProjectSetupResourceUpdates,
    getKoreanFieldworkInvestigationModeLabel,
    getKoreanFieldworkProjectSetupDefaultsFromDocument,
    getKoreanFieldworkProjectResourceValue,
    isKoreanFieldworkProject,
    isKoreanFieldworkProjectSetupFilledIn
} from '../../util/korean-fieldwork-project-setup';
import {
    getKoreanFieldworkSatelliteMapProviderNotice,
    hasKoreanFieldworkSatelliteMapDisplayKey
} from '../../util/korean-fieldwork-map-provider-settings';

import { ip as getIpAddress } from 'address';
import { electronRemote as remote } from 'src/app/electron/electron';


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
    public ipAddress: string = getIpAddress() ?? '';
    public saving: boolean = false;
    public advancedSettingsCollapsed: boolean = true;
    public isLinux: boolean;
    public existingBackupsSizeLabel: string;
    public estimatedBackupsSizeLabel: string;
    public projectDocument: Document|undefined;
    public koreanInvestigationMode: string = KOREAN_FIELDWORK_DEFAULT_INVESTIGATION_MODE;
    public koreanBoundarySummary: string = '';
    public koreanProjectSetupSaved: boolean = false;
    public readonly koreanInvestigationModes = KOREAN_FIELDWORK_INVESTIGATION_MODES;

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
                private decimalPipe: DecimalPipe,
                private datastore: Datastore,
                private projectConfiguration: ProjectConfiguration) {

        this.settingsProvider.settingsChangesNotifications().subscribe(settings => this.settings = settings);
    }


    public hasCustomBackups = () => this.settings.keepBackups.custom > 0 && this.settings.keepBackups.customInterval > 0;

    public hasDailyBackups = () => this.settings.keepBackups.daily > 0;

    public hasWeeklyBackups = () => this.settings.keepBackups.weekly > 0;

    public hasMonthlyBackups = () => this.settings.keepBackups.monthly > 0;


    async ngOnInit() {

        this.isLinux = remote.getGlobal('os') === 'Linux';
        this.settings = this.settingsProvider.getSettings();
        this.originalKeepBackupSettings = clone(this.settings.keepBackups);
        await this.loadKoreanProjectSetup();
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

        if (!this.advancedSettingsCollapsed) {
            this.scrollToAdvancedSettings = true;
            this.updateBackupValues();
        }
    }


    public setKeepBackupsValue(type: 'custom'|'customInterval'|'daily'|'weekly'|'monthly', value: number) {

        this.settings.keepBackups[type] = Math.min(1000000, Math.max(0, value));
        this.scrollToBottom = true;
        this.estimatedBackupsSizeLabel = this.getEstimatedSizeLabel();
    }


    public isKoreanFieldworkProject = () =>
        isKoreanFieldworkProject(this.projectDocument, this.projectConfiguration);


    public getKoreanProjectIdentifier = () => this.settings?.selectedProject ?? '';


    public getKoreanInvestigationModeLabel = () =>
        getKoreanFieldworkInvestigationModeLabel(this.getProjectResourceValue(
            KOREAN_FIELDWORK_PROJECT_INVESTIGATION_MODE_FIELD
        ));


    public getKoreanBoundarySummary = () =>
        this.getProjectResourceValue(KOREAN_FIELDWORK_PROJECT_BOUNDARY_SUMMARY_FIELD) ?? '';


    public getKoreanTabletSyncUrl = () => `http://${this.ipAddress}:3000`;


    public hasKoreanTabletSyncPassword = () => !!this.settings?.hostPassword?.trim();


    public getKoreanTabletSyncPassword = () => this.settings?.hostPassword ?? '';


    public hasKoreanSatelliteMapDisplayKey = () =>
        hasKoreanFieldworkSatelliteMapDisplayKey(this.settings?.mapProviderSettings);


    public getKoreanMapProviderNotice = () =>
        getKoreanFieldworkSatelliteMapProviderNotice(this.settings?.mapProviderSettings);


    public setKoreanInvestigationMode(modeId: string) {

        this.koreanInvestigationMode = modeId;
        this.koreanProjectSetupSaved = false;
    }


    public markKoreanProjectSetupChanged() {

        this.koreanProjectSetupSaved = false;
    }


    public canSaveKoreanProjectSetup = () =>
        this.isKoreanFieldworkProject()
        && isKoreanFieldworkProjectSetupFilledIn(this.koreanInvestigationMode, this.koreanBoundarySummary)
        && this.hasKoreanProjectSetupChanges();


    public hasKoreanProjectSetupChanges = () =>
        this.koreanInvestigationMode !== (
            this.getProjectResourceValue(KOREAN_FIELDWORK_PROJECT_INVESTIGATION_MODE_FIELD)
                ?? KOREAN_FIELDWORK_DEFAULT_INVESTIGATION_MODE
        )
        || this.koreanBoundarySummary.trim() !== this.getKoreanBoundarySummary();


    public getKoreanProjectSetupNotice(): string {

        if (!isKoreanFieldworkProjectSetupFilledIn(this.koreanInvestigationMode, this.koreanBoundarySummary)) {
            return '조사 방식과 조사 경계를 채워야 프로젝트 기본 흐름을 안정적으로 사용할 수 있습니다.';
        }

        if (this.koreanProjectSetupSaved) {
            return '저장됨. 프로젝트 정보와 태블릿 기본 흐름에 같은 기준이 반영됩니다.';
        }

        if (this.hasKoreanProjectSetupChanges()) {
            return '저장하면 프로젝트 정보와 태블릿 기본 흐름에 반영됩니다.';
        }

        return '프로젝트 생성 때 정한 조사 방식과 경계 기준입니다.';
    }


    public async save() {

        AngularUtility.blurActiveElement();

        if (
            this.isKoreanFieldworkProject()
            && this.hasKoreanProjectSetupChanges()
            && !isKoreanFieldworkProjectSetupFilledIn(this.koreanInvestigationMode, this.koreanBoundarySummary)
        ) {
            this.messages.add([M.PROJECT_CREATION_ERROR_KOREAN_FIELDWORK_SETUP]);
            return;
        }

        this.saving = true;
        const languagesChanged: boolean
            = !equal(this.settings.languages)(this.settingsProvider.getSettings().languages);

        try {
            await this.settingsService.updateSettings(this.settings, 'settings');
            await this.saveKoreanProjectSetupIfNeeded();
        } catch (err) {
            this.saving = false;
            if (err === SettingsErrors.MISSING_USERNAME) {
                this.messages.add([M.SETTINGS_ERROR_MISSING_USERNAME]);
            } else if (Array.isArray(err)) {
                this.messages.add(err);
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


    private async loadKoreanProjectSetup() {

        try {
            this.projectDocument = await this.datastore.get('project');
            this.setKoreanProjectSetupFieldsFromDocument();
        } catch (_) {
            this.projectDocument = undefined;
        }
    }


    private setKoreanProjectSetupFieldsFromDocument() {

        const setupDefaults = getKoreanFieldworkProjectSetupDefaultsFromDocument(this.projectDocument);

        this.koreanInvestigationMode = setupDefaults.investigationModeId
            ?? KOREAN_FIELDWORK_DEFAULT_INVESTIGATION_MODE;
        this.koreanBoundarySummary = setupDefaults.boundarySummary ?? '';
        this.koreanProjectSetupSaved = false;
    }


    private async saveKoreanProjectSetupIfNeeded() {

        if (!this.projectDocument || !this.canSaveKoreanProjectSetup()) return;

        const updatedProjectDocument: Document = Document.clone(this.projectDocument);
        Object.assign(
            updatedProjectDocument.resource,
            createKoreanFieldworkProjectSetupResourceUpdates({
                investigationModeId: this.koreanInvestigationMode,
                boundarySummary: this.koreanBoundarySummary
            })
        );

        this.projectDocument = await this.datastore.update(updatedProjectDocument);
        this.setKoreanProjectSetupFieldsFromDocument();
        this.koreanProjectSetupSaved = true;
    }


    private getProjectResourceValue(fieldName: string): string|undefined {

        return getKoreanFieldworkProjectResourceValue(this.projectDocument, fieldName);
    }


    private updateBackupValues() {

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
        
        return keepBackupsSettings.daily
            + keepBackupsSettings.weekly
            + keepBackupsSettings.monthly
            + (keepBackupsSettings.customInterval ? keepBackupsSettings.custom : 0)
            + 1;
    }
}
