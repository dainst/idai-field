import {Component, OnInit} from "@angular/core";
import {ConfigLoader} from 'idai-components-2/configuration';
import {SettingsService} from "./settings-service";

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

    constructor(
        private configLoader: ConfigLoader,
        private settingsService: SettingsService
    ) {
        this.configLoader.getProjectConfiguration().then(conf => {
            this.selectedProject = conf.getProjectIdentifier();
        })
    }

    public addRemoteSite() {
        this.remoteSites.push({
            ipAddress: ""
        })
    }

    public removeRemoteSite(i) {
        this.remoteSites.splice(i,1);
    }

    ngOnInit() {
        this.userName = this.settingsService.getUserName();
        this.remoteSites = this.settingsService.getRemoteSites();
        this.server = this.settingsService.getServer();
    }

    public save() {
        this.settingsService.setServer(this.server);
        this.settingsService.setUserName(this.userName);
        this.settingsService.setRemoteSites(this.remoteSites);
    }
}