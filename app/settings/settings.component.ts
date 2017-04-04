import {Component} from "@angular/core";

@Component({
    moduleId: module.id,
    templateUrl: './settings.html'
})
/**
 * @author Daniel de Oliveira
 */
export class SettingsComponent {

    public selectedProject;

    constructor() { }

    public selectProject() {
        console.log("select project",this.selectedProject);
    }
}