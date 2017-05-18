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
    public remoteSites = [];
    public server = {};
    public ready = undefined;

    constructor(
        private settingsService: SettingsService,
        private messages: Messages
    ) { }

    public addRemoteSite() {
        this.remoteSites.push({
            ipAddress: ""
        })
    }

    public removeRemoteSite(i) {
        this.remoteSites.splice(i,1);
    }

    ngOnInit() {
        this.settingsService.ready.then(() => {

            this.ready = true;

            this.userName = this.settingsService.getUserName();
            this.remoteSites = this.settingsService.getRemoteSites();
            this.server = this.settingsService.getServer();
            this.selectedProject = this.settingsService.getSelectedProject();
        });
    }

    public save() {
        this.settingsService.setUserName(this.userName);
        this.settingsService.setServer(this.server);
        this.settingsService.setRemoteSites(this.remoteSites);

        this.settingsService.selectProject(this.selectedProject,true).then(
            () => this.messages.add([M.SETTINGS_ACTIVATED]),
                err => { console.error(err); }
            );
    }
}