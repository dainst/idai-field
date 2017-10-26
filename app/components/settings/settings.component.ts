import {Component, OnInit} from '@angular/core';
import {Messages} from 'idai-components-2/messages';
import {SettingsService} from '../../core/settings/settings-service';
import {M} from '../../m';
import {Settings} from '../../core/settings/settings';

const ip = require('ip');

@Component({
    moduleId: module.id,
    templateUrl: './settings.html'
})
/**
 * @author Daniel de Oliveira
 * @author Sebastian Cuy
 */
export class SettingsComponent implements OnInit {


    public settings: Settings;
    public ready: boolean = false;
    public saving: boolean = false;
    public ipAddress: string = ip.address();


    constructor(private settingsService: SettingsService,
                private messages: Messages) {
    }


    ngOnInit() {

        this.settingsService.ready.then(() => {
            this.ready = true;
            this.settings = this.settingsService.getSettings();
        });
    }


    public toggleSync() {

        this.settings.isSyncActive = !this.settings.isSyncActive;
    }


    public save() {

        this.saving = true;

        this.settingsService.updateSettings(this.settings).then(() => {
            this.settingsService.restartSync().then(
                () => {
                    this.saving = false;
                    this.messages.add([M.SETTINGS_ACTIVATED]);
                },
                err => {
                    this.saving = false;
                    console.error(err);
                }
            );
        }).catch(() => {
            this.saving = false;
            this.messages.add([M.SETTINGS_MALFORMED_ADDRESS]);
        });
    }
}