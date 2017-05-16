import {Component, OnInit} from "@angular/core";
import {Messages} from 'idai-components-2/messages';
import {ConfigLoader} from 'idai-components-2/configuration';
import {SettingsService} from "./settings-service";
import {M} from "../m";
import {IdaiFieldDatastore} from "../datastore/idai-field-datastore";

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
        private settingsService: SettingsService,
        private messages: Messages,
        private datastore: IdaiFieldDatastore
    ) {
        this.configLoader.getProjectConfiguration().then(conf => {
            this.selectedProject = conf.getProjectIdentifier();
        })
    }

    public changeProject() {
        this.datastore.select("pergamon");
    }

    public changeBack() {
        this.datastore.select("idai-field-documents");
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
        this.settingsService.ready.then(() => {
            this.userName = this.settingsService.getUserName();
            this.remoteSites = this.settingsService.getRemoteSites();
            this.server = this.settingsService.getServer();
        });
    }

    public save() {
        this.settingsService.setUserName(this.userName);
        this.settingsService.setServer(this.server);
        this.settingsService.setRemoteSites(this.remoteSites)
            .then(
                () => { return this.settingsService.updateConfigFile(); }
            ).then(
                () => this.messages.add([M.SETTINGS_ACTIVATED]),
                err => { console.error(err); }
            );
    }
}