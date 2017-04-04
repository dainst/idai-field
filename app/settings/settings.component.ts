import {Component} from "@angular/core";
import {AppConfigurator} from "../app-configurator";

@Component({
    moduleId: module.id,
    templateUrl: './settings.html'
})
/**
 * @author Daniel de Oliveira
 */
export class SettingsComponent {

    public selectedProject;

    constructor(private appConfigurator: AppConfigurator) { }

    public selectProject() {
        this.appConfigurator.go(this.selectedProject,true);
    }
}