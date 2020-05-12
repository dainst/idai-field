import {Component, OnInit} from '@angular/core';
import {SettingsService} from '../../core/settings/settings-service';
import {Settings} from '../../core/settings/settings';
import {M} from '../messages/m';
import {TabManager} from '../../core/tabs/tab-manager';
import OpenDialogReturnValue = Electron.OpenDialogReturnValue;
import {Messages} from '../messages/messages';

const address = window.require('address');
const remote = window.require('electron').remote;


@Component({
    moduleId: module.id,
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
export class SettingsComponent implements OnInit {

    public settings: Settings;
    public saving: boolean = false;
    public ipAddress: string = address.ip();


    constructor(private settingsService: SettingsService,
                private messages: Messages,
                private tabManager: TabManager) {
    }


    ngOnInit() {

        this.settings = this.settingsService.getSettings();
    }


    public async onKeyDown(event: KeyboardEvent) {

        if (event.key === 'Escape') await this.tabManager.openActiveTab();
    }


    public toggleSync() {

        this.settings.isSyncActive = !this.settings.isSyncActive;
    }


    public toggleAutoUpdate() {

        this.settings.isAutoUpdateActive = !this.settings.isAutoUpdateActive;
    }


    public async save() {

        this.saving = true;
        const localeChanged: boolean = this.settings.locale !== this.settingsService.getSettings().locale;

        try {
            await this.settingsService.updateSettings(this.settings);
        } catch (err) {
            this.saving = false;
            this.messages.add([M.SETTINGS_ERROR_MALFORMED_ADDRESS]);
            return;
        }

        await this.handleSaveSuccess(localeChanged);
    }


    public async chooseImagestoreDirectory() {

        const result: OpenDialogReturnValue = await remote.dialog.showOpenDialog(
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


    private async handleSaveSuccess(localeChanged: boolean) {

        remote.getGlobal('updateConfig')(this.settings);

        if (localeChanged) {
            window.location.reload();
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
