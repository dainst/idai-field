import { AfterViewChecked, Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { equal } from 'tsfun';
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

const address = globalThis.require('address');
const remote = globalThis.require('@electron/remote');


@Component({
    templateUrl: './settings.html',
    host: {
        '(window:keydown)': 'onKeyDown($event)'
    }
})
/**
 * @author Daniel de Oliveira
 * @author Sebastian Cuy
 * @author Thomas Kleinke
 */
export class SettingsComponent implements OnInit, AfterViewChecked {

    @ViewChild('settingsContainer') settingsContainer: ElementRef;

    public settings: Settings;
    public ipAddress: string = address.ip();
    public saving: boolean = false;
    public advancedSettingsCollapsed: boolean = true;
    public scrollToBottom: boolean = false;
    public isLinux: boolean;


    constructor(private settingsProvider: SettingsProvider,
                private settingsService: SettingsService,
                private messages: Messages,
                private tabManager: TabManager,
                private menuService: Menus) {

        this.settingsProvider.settingsChangesNotifications().subscribe(settings => this.settings = settings);
    }


    ngOnInit() {

        this.isLinux = remote.getGlobal('os') === 'Linux';
        this.settings = this.settingsProvider.getSettings();
    }


    ngAfterViewChecked() {

        if (this.scrollToBottom) {
            this.settingsContainer.nativeElement.scrollTo(0, this.settingsContainer.nativeElement.scrollHeight);
            this.scrollToBottom = false;
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
        if (!this.advancedSettingsCollapsed) this.scrollToBottom = true;
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


    public async chooseImagestoreDirectory() {

        const result: any = await remote.dialog.showOpenDialog(
            remote.getCurrentWindow(),
            {
                properties: ['openDirectory', 'createDirectory'],
                defaultPath: this.settings.imagestorePath
            }
        );

        if (result && result.filePaths.length > 0) {
            this.settings.imagestorePath = result.filePaths[0];
        }
    }


    private async handleSaveSuccess(languagesChanged: boolean) {

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
}
