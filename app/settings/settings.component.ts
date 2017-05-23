import {Component, OnInit} from "@angular/core";
import {Messages} from 'idai-components-2/messages';
import {SettingsService} from "./settings-service";
import {M} from "../m";

@Component({
    moduleId: module.id,
    templateUrl: './settings.html'
})
/**
 * @author Daniel de Oliveira
 */
export class SettingsComponent implements OnInit {

    public selectedProject;
    public userName;
    public server = {};
    public ready = undefined;
    public saving = false;

    constructor(private settingsService: SettingsService,
                private messages: Messages) {
    }

    ngOnInit() {
        this.settingsService.ready.then(() => {

            this.ready = true;

            this.userName = this.settingsService.getUserName();
            this.server = this.settingsService.getServer();
            this.selectedProject = this.settingsService.getSelectedProject();
        });
    }

    public save() {

        this.saving = true;

        this.settingsService.setUserName(this.userName);
        this.settingsService.setServer(this.server);

        this.settingsService.selectProject(this.selectedProject, true).then(
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