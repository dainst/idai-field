import {Component, OnInit} from "@angular/core";
import {Messages} from 'idai-components-2/messages';
import {SettingsService} from "./settings-service";
import {M} from "../m";
import {SyncTarget} from "./settings";

@Component({
    moduleId: module.id,
    templateUrl: './settings.html'
})
/**
 * @author Daniel de Oliveira
 */
export class SettingsComponent implements OnInit {

    public selectedProject;
    public username;
    public server : SyncTarget = { address: undefined, username: undefined, password: undefined};
    public ready = undefined;
    public saving = false;

    constructor(private settingsService: SettingsService,
                private messages: Messages) {
    }

    ngOnInit() {
        this.settingsService.ready.then(() => {

            this.ready = true;

            this.username = this.settingsService.getUsername();
            this.server = this.settingsService.getSyncTarget();
            this.selectedProject = this.settingsService.getSelectedProject();
        });
    }

    public save() {

        this.saving = true;

        this.settingsService.activateProject(
            this.selectedProject,
            this.username,
            this.server,
            true).then(
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