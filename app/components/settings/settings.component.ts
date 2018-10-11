import {Component, OnInit} from '@angular/core';
import {Messages} from 'idai-components-2';
import {SettingsService} from '../../core/settings/settings-service';
import {Settings} from '../../core/settings/settings';
import {M} from '../m';

const ip = require('ip');
const remote = require('electron').remote;


@Component({
    moduleId: module.id,
    templateUrl: './settings.html'
})
/**
 * @author Daniel de Oliveira
 * @author Sebastian Cuy
 * @author Thomas Kleinke
 */
export class SettingsComponent implements OnInit {

    public settings: Settings;
    public saving: boolean = false;
    public ipAddress: string = ip.address();


    constructor(private settingsService: SettingsService,
                private messages: Messages) {
    }


    ngOnInit() {

        this.settings = this.settingsService.getSettings();
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


    private async handleSaveSuccess(localeChanged: boolean) {

        remote.getGlobal('updateConfig')(this.settings);

        if (localeChanged) {
            window.location.reload();
        } else {
            try {
                await this.settingsService.restartSync();
                this.messages.add([M.SETTINGS_SUCCESS]);
            } catch (err) {
                console.error(err);
            } finally {
                this.saving = false;
            }
        }
    }
}