import {Component, OnInit} from '@angular/core';
import {Messages} from 'idai-components-2/messages';
import {SettingsService} from './settings-service';
import {M} from '../m';
import {SyncTarget} from './settings';

const ip = require('ip');

@Component({
    moduleId: module.id,
    templateUrl: './settings.html'
})
/**
 * @author Daniel de Oliveira
 */
export class SettingsComponent implements OnInit {

    public username: string;
    public server: SyncTarget = { address: undefined, username: undefined, password: undefined };
    public ready: boolean = false;
    public saving: boolean = false;
    public ipAddress: string = ip.address();

    constructor(private settingsService: SettingsService,
                private messages: Messages) {
    }

    ngOnInit() {

        this.settingsService.ready.then(() => {
            this.ready = true;
            this.username = this.settingsService.getUsername();
            this.server = this.settingsService.getSyncTarget();
        });
    }

    private validateSettings(): boolean {

        const validationError = this.settingsService.setSettings(this.username, this.server, '');

        if (validationError) {
            this.messages.add([M.SETTINGS_MALFORMED_ADDRESS]);
            return false;
        }

        return true;
    }

    public save() {

        if (!this.validateSettings()) return;

        this.saving = true;

        this.settingsService.restartSync().then(
            () => {
                this.saving = false;
                this.messages.add([M.SETTINGS_ACTIVATED])
            },
            err => {
                this.saving = false;
                console.error(err);
            }
        );
    }
}